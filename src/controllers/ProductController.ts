import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';
import { StockService } from '../services/StockService';
import { ProductRequest, ProductDTO } from '../types';

export class ProductController {
  private productService: ProductService;
  private stockService: StockService;

  constructor() {
    this.productService = new ProductService();
    this.stockService = new StockService();
  }

  getAllProducts = async (req: Request, res: Response) => {
    try {
      const products = await this.productService.findAllActive();
      const dtos = await Promise.all(products.map(p => this.mapToDTO(p)));
      res.json(dtos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getArchivedProducts = async (req: Request, res: Response) => {
    try {
      const products = await this.productService.findAllArchived();
      const dtos = await Promise.all(products.map(p => this.mapToDTO(p)));
      res.json(dtos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getProduct = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const product = await this.productService.findById(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      const dto = await this.mapToDTO(product);
      res.json(dto);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  createProduct = async (req: Request, res: Response) => {
    try {
      const request: ProductRequest = req.body;
      const product = await this.productService.createOrUpdateProduct(request);
      const dto = await this.mapToDTO(product);
      res.status(201).json(dto);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  updateProduct = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const request: ProductRequest = req.body;
      const product = await this.productService.createOrUpdateProduct(request, id);
      const dto = await this.mapToDTO(product);
      res.json(dto);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  deleteProduct = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await this.productService.deleteOrDeactivate(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  reactivateProduct = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const product = await this.productService.reactivateProduct(id);
      const dto = await this.mapToDTO(product);
      res.json(dto);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  private async mapToDTO(p: any): Promise<ProductDTO> {
    const stockQuantity = await this.stockService.getTotalStock(p.id);
    
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      purchasePriceHT: p.purchase_priceht,
      profitMarginPercent: p.profit_margin_percent,
      vatPercent: p.vat_percent,
      sellingPriceTTC: p.selling_pricettc,
      stockQuantity,
      active: p.active,
      characteristics: p.characteristics,
      imageUrls: []
    };
  }
}
