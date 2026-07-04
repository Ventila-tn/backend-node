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
      
      // FORCER la séparation : rejeter si images incluses
      if (request.imageUrls && request.imageUrls.length > 0) {
        // Calculer la taille approximative des images
        const totalImageSize = request.imageUrls.reduce((total, url) => {
          return total + (url.length * 0.75); // Base64 fait ~75% de la taille binaire
        }, 0);
        
        if (totalImageSize > 2 * 1024 * 1024) { // 2MB pour images
          return res.status(413).json({
            error: 'Images too large',
            message: 'Utilisez l\'endpoint /products/{id}/images pour uploader les images séparément',
            suggestedEndpoint: `/api/products/${id}/images`,
            imageCount: request.imageUrls.length,
            estimatedSize: Math.round(totalImageSize / 1024) + ' KB'
          });
        }
      }
      
      // Traiter normalement si pas d'images ou images légères
      const productData = { ...request };
      const imageUrls = productData.imageUrls;
      delete productData.imageUrls;
      
      console.log('📝 Mise à jour produit sans images:', { id, hasImages: !!imageUrls?.length });
      
      const product = await this.productService.createOrUpdateProduct(productData, id);
      
      // Traiter les images seulement si légères
      if (imageUrls !== undefined) {
        console.log('🖼️ Traitement images légères:', imageUrls.length, 'images');
        await this.deleteProductImages(id);
        if (imageUrls.length > 0) {
          await this.saveProductImages(id, imageUrls);
        }
      }
      
      const result = await this.productService.findByIdWithImages(id);
      const dto = await this.mapToDTOWithImages(result!.product, result!.imageUrls);
      res.json(dto);
    } catch (error: any) {
      console.error('❌ Erreur updateProduct:', error);
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

  // Endpoint séparé pour uploader les images d'un produit
  updateProductImages = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { imageUrls } = req.body;
      
      if (!Array.isArray(imageUrls)) {
        return res.status(400).json({ message: 'imageUrls must be an array' });
      }

      console.log('🖼️ Upload images pour produit', id, ':', imageUrls.length, 'images');

      // Vérifier que le produit existe
      const product = await this.productService.findById(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Remplacer toutes les images
      await this.deleteProductImages(id);
      if (imageUrls.length > 0) {
        await this.saveProductImages(id, imageUrls);
      }

      // Retourner le produit avec ses nouvelles images
      const result = await this.productService.findByIdWithImages(id);
      const dto = await this.mapToDTOWithImages(result!.product, result!.imageUrls);
      res.json({ message: 'Images updated successfully', product: dto });
    } catch (error: any) {
      console.error('❌ Erreur updateProductImages:', error);
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
      purchasePriceHT: Number(p.purchase_priceht),
      profitMarginPercent: Number(p.profit_margin_percent),
      vatPercent: Number(p.vat_percent),
      sellingPriceTTC: Number(p.selling_pricettc),
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
      purchasePriceHT: Number(p.purchase_priceht),
      profitMarginPercent: Number(p.profit_margin_percent),
      vatPercent: Number(p.vat_percent),
      sellingPriceTTC: Number(p.selling_pricettc),
      stockQuantity,
      active: p.active,
      characteristics: p.characteristics,
      imageUrls
    };
  }
}
