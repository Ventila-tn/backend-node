import { Request, Response } from 'express';
import pool from '../config/database';
import { Category, CategoryDTO, CategoryRequest } from '../types';

export class CategoryController {

  getAllCategories = async (req: Request, res: Response) => {
    try {
      const result = await pool.query<Category & { parent_name: string | null }>(
        `SELECT c.*, p.name as parent_name 
         FROM categories c
         LEFT JOIN categories p ON c.parent_id = p.id
         ORDER BY c.id`
      );
      
      const dtos: CategoryDTO[] = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        parentId: row.parent_id,
        parentName: row.parent_name
      }));
      
      res.json(dtos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  createCategory = async (req: Request, res: Response) => {
    try {
      const { name, parentId }: CategoryRequest = req.body;
      
      // Vérifier si la catégorie parente existe si parentId est fourni
      if (parentId) {
        const parentExists = await pool.query(
          'SELECT id FROM categories WHERE id = $1',
          [parentId]
        );
        
        if (parentExists.rows.length === 0) {
          return res.status(404).json({ message: 'Parent category not found' });
        }
      }
      
      const result = await pool.query<Category>(
        `INSERT INTO categories (name, parent_id) 
         VALUES ($1, $2) 
         RETURNING *`,
        [name, parentId || null]
      );
      
      const category = result.rows[0];
      
      // Récupérer le nom du parent si nécessaire
      let parentName = null;
      if (category.parent_id) {
        const parentResult = await pool.query<{ name: string }>(
          'SELECT name FROM categories WHERE id = $1',
          [category.parent_id]
        );
        parentName = parentResult.rows[0]?.name || null;
      }
      
      const dto: CategoryDTO = {
        id: category.id,
        name: category.name,
        parentId: category.parent_id,
        parentName
      };
      
      res.status(201).json(dto);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  deleteCategory = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      await pool.query('DELETE FROM categories WHERE id = $1', [id]);
      
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}
