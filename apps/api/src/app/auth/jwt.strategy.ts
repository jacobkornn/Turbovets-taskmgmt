// auth/jwt.strategy.ts (patch)
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Bearer token
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET, // matches AuthService.sign
    });
  }

  async validate(payload: { sub: number; username: string; role: string }) {
    // what becomes req.user
    return { sub: payload.sub, username: payload.username, role: payload.role };
  }
}