import { User } from '../app/user/user.entity';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
