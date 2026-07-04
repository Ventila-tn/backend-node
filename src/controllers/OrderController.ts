import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { CheckoutRequest, OrderStatus } from '../types';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  checkout = async (req: Request, res: Response) => {
    try {
      const request: CheckoutRequest = req.body;
      
      console.log('📥 Requête checkout reçue:', {
        ...request,
        deliveryFee: request.deliveryFee,
        deliveryFeeType: typeof request.deliveryFee
      });

      const order = await this.orderService.placeOrder(request);
      
      console.log('✅ Commande créée avec succès:', {
        id: order.id,
        reference: order.reference,
        deliveryFee: order.delivery_fee,
        totalAmount: order.total_amount
      });
      
      res.status(200).json(this.mapOrderToDTO(order));
    } catch (error: any) {
      console.error('❌ Erreur checkout:', error);
      res.status(400).json({ message: error.message });
    }
  };

  getAllOrders = async (req: Request, res: Response) => {
    try {
      const orders = await this.orderService.getAllOrders();
      const mappedOrders = orders.map(order => this.mapOrderToDTO(order));
      res.json(mappedOrders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  updateOrderStatus = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const order = await this.orderService.updateOrderStatus(id, status as OrderStatus);
      res.json(this.mapOrderToDTO(order));
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  getOrderById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const order = await this.orderService.getOrderById(id);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      res.json(this.mapOrderToDTO(order));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getOrderItems = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const items = await this.orderService.getOrderItems(id);
      const mappedItems = items.map(item => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        totalPrice: Number(item.total_price)
      }));
      res.json(mappedItems);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  private mapOrderToDTO(order: any) {
    return {
      id: order.id,
      orderDate: order.order_date,
      status: order.status,
      userId: order.user_id,
      totalAmount: Number(order.total_amount),
      firstName: order.first_name,
      lastName: order.last_name,
      address: order.address,
      phone: order.phone,
      email: order.email,
      hasStockShortage: order.has_stock_shortage,
      reference: order.reference,
      city: order.city,
      governorate: order.governorate,
      deliveryFee: Number(order.delivery_fee) || 0
    };
  }
}
