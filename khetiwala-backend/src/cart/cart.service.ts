import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument, CartItem, CartItemType, CartItemDocument } from './schemas/cart.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartModel.findOne({ userId: new Types.ObjectId(userId) });
    
    if (!cart) {
      cart = new this.cartModel({ userId: new Types.ObjectId(userId) });
      await cart.save();
    }
    
    return cart;
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart> {
    const { productId, quantity, itemType, rentalStartDate, rentalEndDate } = addToCartDto;

    // Validate product exists and is available
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isAvailable || product.status !== 'active') {
      throw new BadRequestException('Product is not available');
    }

    if (product.quantity < quantity) {
      throw new BadRequestException('Insufficient product quantity');
    }

    // Validate rental requirements
    if (itemType === CartItemType.RENT) {
      if (!product.rentalPrice) {
        throw new BadRequestException('Product is not available for rent');
      }
      if (!rentalStartDate || !rentalEndDate) {
        throw new BadRequestException('Rental start and end dates are required for rental items');
      }
      if (new Date(rentalStartDate) >= new Date(rentalEndDate)) {
        throw new BadRequestException('Rental end date must be after start date');
      }
    }

    const cart = await this.getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.itemType === itemType
    );

    const price = itemType === CartItemType.RENT ? product.rentalPrice! : product.price;
    const rentalDays = itemType === CartItemType.RENT ? 
      Math.ceil((new Date(rentalEndDate!).getTime() - new Date(rentalStartDate!).getTime()) / (1000 * 60 * 60 * 24)) : 
      undefined;

    if (existingItemIndex >= 0) {
      // Update existing item
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].price = price;
      if (itemType === CartItemType.RENT) {
        cart.items[existingItemIndex].rentalStartDate = new Date(rentalStartDate!);
        cart.items[existingItemIndex].rentalEndDate = new Date(rentalEndDate!);
        cart.items[existingItemIndex].rentalDays = rentalDays;
      }
    } else {
      // Add new item
      const newItem: CartItem = {
        product: new Types.ObjectId(productId),
        quantity,
        price,
        itemType,
        rentalStartDate: itemType === CartItemType.RENT ? new Date(rentalStartDate!) : undefined,
        rentalEndDate: itemType === CartItemType.RENT ? new Date(rentalEndDate!) : undefined,
        rentalDays,
      };
      cart.items.push(newItem);
    }

    await this.calculateCartTotals(cart);
    const savedCart = await (cart as CartDocument).save();
    
    // Populate the product data before returning
    const populatedCart = await this.cartModel
      .findById((savedCart as any)._id)
      .populate({
        path: 'items.product',
        model: 'Product'
      })
      .exec();
    
    if (!populatedCart) {
      throw new NotFoundException('Cart not found after save');
    }
    
    return populatedCart;
  }

  async updateCartItem(userId: string, itemId: string, updateCartItemDto: UpdateCartItemDto): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    const itemIndex = cart.items.findIndex((item: any) => item._id?.toString() === itemId);

    if (itemIndex === -1) {
      throw new NotFoundException('Cart item not found');
    }

    const { quantity, itemType, rentalStartDate, rentalEndDate } = updateCartItemDto;
    const item = cart.items[itemIndex];

    // Get product to validate availability
    const product = await this.productModel.findById(item.product);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (quantity !== undefined) {
      if (product.quantity < quantity) {
        throw new BadRequestException('Insufficient product quantity');
      }
      item.quantity = quantity;
    }

    if (itemType !== undefined) {
      if (itemType === CartItemType.RENT && !product.rentalPrice) {
        throw new BadRequestException('Product is not available for rent');
      }
      item.itemType = itemType;
      item.price = itemType === CartItemType.RENT ? product.rentalPrice! : product.price;
    }

    if (rentalStartDate !== undefined) {
      item.rentalStartDate = new Date(rentalStartDate);
    }

    if (rentalEndDate !== undefined) {
      item.rentalEndDate = new Date(rentalEndDate);
    }

    // Recalculate rental days if rental dates are provided
    if (item.itemType === CartItemType.RENT && item.rentalStartDate && item.rentalEndDate) {
      item.rentalDays = Math.ceil(
        (item.rentalEndDate.getTime() - item.rentalStartDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    await this.calculateCartTotals(cart);
    const savedCart = await (cart as CartDocument).save();
    
    // Populate the product data before returning
    const populatedCart = await this.cartModel
      .findById((savedCart as any)._id)
      .populate({
        path: 'items.product',
        model: 'Product'
      })
      .exec();
    
    if (!populatedCart) {
      throw new NotFoundException('Cart not found after save');
    }
    
    return populatedCart;
  }

  async removeFromCart(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    const itemIndex = cart.items.findIndex((item: any) => item._id?.toString() === itemId);

    if (itemIndex === -1) {
      throw new NotFoundException('Cart item not found');
    }

    cart.items.splice(itemIndex, 1);
    await this.calculateCartTotals(cart);
    const savedCart = await (cart as CartDocument).save();
    
    // Populate the product data before returning
    const populatedCart = await this.cartModel
      .findById((savedCart as any)._id)
      .populate({
        path: 'items.product',
        model: 'Product'
      })
      .exec();
    
    if (!populatedCart) {
      throw new NotFoundException('Cart not found after save');
    }
    
    return populatedCart;
  }

  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    cart.items = [];
    await this.calculateCartTotals(cart);
    const savedCart = await (cart as CartDocument).save();
    
    // Populate the product data before returning
    const populatedCart = await this.cartModel
      .findById((savedCart as any)._id)
      .populate({
        path: 'items.product',
        model: 'Product'
      })
      .exec();
    
    if (!populatedCart) {
      throw new NotFoundException('Cart not found after save');
    }
    
    return populatedCart;
  }

  async getCart(userId: string): Promise<Cart> {
    const cart = await this.cartModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate({
        path: 'items.product',
        model: 'Product'
      })
      .exec();

    if (!cart) {
      const newCart = await this.getOrCreateCart(userId);
      // Populate the new cart as well
      const populatedNewCart = await this.cartModel
        .findById((newCart as any)._id)
        .populate({
          path: 'items.product',
          model: 'Product'
        })
        .exec();
      
      if (!populatedNewCart) {
        throw new NotFoundException('Failed to create cart');
      }
      
      return populatedNewCart;
    }

    return cart;
  }

  private async calculateCartTotals(cart: Cart): Promise<void> {
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    
    let totalPrice = 0;
    let totalRentalPrice = 0;

    for (const item of cart.items) {
      if (item.itemType === CartItemType.RENT) {
        const rentalTotal = item.price * item.quantity * (item.rentalDays || 1);
        totalRentalPrice += rentalTotal;
      } else {
        totalPrice += item.price * item.quantity;
      }
    }

    cart.totalPrice = totalPrice;
    cart.totalRentalPrice = totalRentalPrice;
  }
}
