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

    // Generate token
    const token = this.generateToken(user);

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
