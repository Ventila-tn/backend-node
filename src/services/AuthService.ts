import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { User, UserRole, AuthRequest, RegisterRequest, AuthResponse } from '../types';

export class AuthService {

  async register(request: RegisterRequest): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await pool.query<User>(
      'SELECT * FROM users WHERE username = $1',
      [request.username]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(request.password, 10);

    // Determine role
    let role = UserRole.ROLE_CLIENT;
    if (request.role) {
      try {
        role = UserRole[request.role as keyof typeof UserRole];
      } catch (error) {
        // Keep default
      }
    }

    // Create user
    const result = await pool.query<User>(
      `INSERT INTO users (username, password, roles) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [request.username, hashedPassword, JSON.stringify([role])]
    );

    const user = result.rows[0];

    // Generate token
    const token = this.generateToken(user);

    return { token };
  }

  async login(request: AuthRequest): Promise<AuthResponse> {
    // Find user
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE username = $1',
      [request.username]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(request.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Récupérer les rôles - gestion de la compatibilité Spring Boot
    let roles: UserRole[] = [];
    
    if (user.roles) {
      // Si roles existe dans la table users (format Node.js ou Spring Boot avec jsonb)
      if (typeof user.roles === 'string') {
        try {
          roles = JSON.parse(user.roles);
        } catch {
          roles = [UserRole.ROLE_CLIENT];
        }
      } else if (Array.isArray(user.roles)) {
        roles = user.roles;
      }
    } else {
      // Si pas de roles dans users, chercher dans user_roles (format Spring Boot)
      const rolesResult = await pool.query(
        'SELECT roles FROM user_roles WHERE user_id = $1',
        [user.id]
      );
      
      if (rolesResult.rows.length > 0) {
        roles = rolesResult.rows.map(row => row.roles as UserRole);
      } else {
        roles = [UserRole.ROLE_CLIENT];
      }
    }

    // Generate token with roles
    const token = this.generateToken({ ...user, roles });

    return { token };
  }

  private generateToken(user: User): string {
    const payload = {
      username: user.username,
      roles: user.roles
    };

    const expiresIn = parseInt(process.env.JWT_EXPIRATION || '86400000') / 1000; // Convert to seconds

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: `${expiresIn}s`
    });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    return result.rows[0] || null;
  }
}
