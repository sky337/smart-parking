// Authentication service

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '@backend/utils/database';
import Logger from '@shared/utils/logger';
import { AuthenticationError, ValidationError } from '@shared/utils/errors';
import { Validator } from '@shared/utils/validator';
import { User, AuthResponse, LoginRequest } from '@shared/types/index';

const logger = new Logger('AuthService');

export class AuthService {
  /**
   * Login user with username and password
   */
  static async login(loginRequest: LoginRequest): Promise<AuthResponse> {
    logger.info('User login attempt', { username: loginRequest.username });

    // Validate input
    const validation = Validator.validateLoginRequest(loginRequest.username, loginRequest.password);
    if (!validation.valid) {
      throw new ValidationError('Invalid login credentials', validation.errors);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username: loginRequest.username },
    });

    if (!user || user.isDeleted) {
      logger.warn('User not found or deleted', { username: loginRequest.username });
      throw new AuthenticationError('Invalid username or password');
    }

    if (user.status !== 'ACTIVE') {
      logger.warn('User account is not active', { username: loginRequest.username, status: user.status });
      throw new AuthenticationError('Your account is not active');
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(loginRequest.password, user.password);
    if (!passwordMatch) {
      logger.warn('Invalid password', { username: loginRequest.username });
      throw new AuthenticationError('Invalid username or password');
    }

    // Generate token
    const token = this.generateToken(user);
    const expiresIn = 24 * 60 * 60; // 24 hours

    logger.info('User logged in successfully', { userId: user.id });

    return {
      user: this.buildUserResponse(user),
      token,
      expiresIn,
    };
  }

  /**
   * Verify JWT token
   */
  static async verifyToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as User;
      
      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.isDeleted || user.status !== 'ACTIVE') {
        throw new AuthenticationError('User no longer active');
      }

      return this.buildUserResponse(user);
    } catch (error) {
      logger.warn('Token verification failed', error as Error);
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  /**
   * Refresh authentication token
   */
  static async refreshToken(token: string): Promise<AuthResponse> {
    try {
      const user = await this.verifyToken(token);
      const newToken = this.generateToken(user as any);

      return {
        user,
        token: newToken,
        expiresIn: 24 * 60 * 60,
      };
    } catch (error) {
      logger.error('Token refresh failed', error as Error);
      throw new AuthenticationError('Could not refresh token');
    }
  }

  /**
   * Generate JWT token
   */
  private static generateToken(user: any): string {
    const payload: User = this.buildUserResponse(user);
    return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
      expiresIn: 24 * 60 * 60,
    });
  }

  /**
   * Build user response object
   */
  private static buildUserResponse(user: any): User {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  /**
   * Create a new user (admin only)
   */
  static async createUser(data: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role: string;
  }): Promise<User> {
    logger.info('Creating new user', { username: data.username, role: data.role });

    // Validate input
    const validation = Validator.validateUserCreation(data);
    if (!validation.valid) {
      throw new ValidationError('Invalid user data', validation.errors);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: data.username }, { email: data.email }],
      },
    });

    if (existingUser) {
      throw new ValidationError('Username or email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as any,
        status: 'ACTIVE',
      },
    });

    logger.info('User created successfully', { userId: user.id });

    return this.buildUserResponse(user);
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    logger.info('Changing password for user', { userId });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Verify old password
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    logger.info('Password changed successfully', { userId });
  }
}
