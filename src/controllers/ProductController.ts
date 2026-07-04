import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';
import { StockService } from '../services/StockService';
import { ProductRequest, ProductDTO } from '../types';
import pool from '../config/database';

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
      const result = await this.productService.findByIdWithImages(id);
      
      if (!result) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      const dto = await this.mapToDTOWithImages(result.product, result.imageUrls);
      res.json(dto);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  createProduct = async (req: Request, res: Response) => {
    try {
      const request: ProductRequest = req.body;
      const product = await this.productService.createOrUpdateProduct(request);
      
      // Ajouter les images si fournies
      if (request.imageUrls && request.imageUrls.length > 0) {
        await this.saveProductImages(product.id, request.imageUrls);
      }
      
      const result = await this.productService.findByIdWithImages(product.id);
      const dto = await this.mapToDTOWithImages(result!.product, result!.imageUrls);
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
      
      // Mettre à jour les images
      if (request.imageUrls) {
        await this.deleteProductImages(id);
        if (request.imageUrls.length > 0) {
          await this.saveProductImages(id, request.imageUrls);
        }
      }
      
      const result = await this.productService.findByIdWithImages(id);
      const dto = await this.mapToDTOWithImages(result!.product, result!.imageUrls);
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
      const result = await this.productService.findByIdWithImages(id);
      const dto = await this.mapToDTOWithImages(result!.product, result!.imageUrls);
      res.json(dto);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  private async saveProductImages(productId: number, imageUrls: string[]): Promise<void> {
    const client = await pool.connect();
    try {
      for (const imageUrl of imageUrls) {
        await client.query(
          'INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)',
          [productId, imageUrl]
        );
      }
    } finally {
      client.release();
    }
  }

  private async deleteProductImages(productId: number): Promise<void> {
    await pool.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
  }

  private async getProductImages(productId: number): Promise<string[]> {
    const result = await pool.query<{ image_url: string }>(
      'SELECT image_url FROM product_images WHERE product_id = $1',
      [productId]
    );
    return result.rows.map(row => row.image_url);
  }

  private async mapToDTO(p: any): Promise<ProductDTO> {
    const stockQuantity = await this.stockService.getTotalStock(p.id);
    const imageUrls = await this.getProductImages(p.id);
    
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
      imageUrls
    };
  }

  private async mapToDTOWithImages(p: any, imageUrls: string[]): Promise<ProductDTO> {
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
      imageUrls
    };
  }
}
