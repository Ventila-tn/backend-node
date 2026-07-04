import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { RegisterRequest, AuthRequest } from '../types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response) => {
    try {
      const request: RegisterRequest = req.body;
      const response = await this.authService.register(request);
      res.status(201).json(response);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Registration failed' });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const request: AuthRequest = req.body;
      const response = await this.authService.login(request);
      res.status(200).json(response);
    } catch (error: any) {
      res.status(401).json({ message: error.message || 'Authentication failed' });
    }
  };
}
