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
      const order = await this.orderService.placeOrder(request);
      res.status(200).json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  getAllOrders = async (req: Request, res: Response) => {
    try {
      const orders = await this.orderService.getAllOrders();
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  updateOrderStatus = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const order = await this.orderService.updateOrderStatus(id, status as OrderStatus);
      res.json(order);
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
      
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getOrderItems = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const items = await this.orderService.getOrderItems(id);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
