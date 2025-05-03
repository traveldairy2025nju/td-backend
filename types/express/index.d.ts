import { User } from '../../src/users/entities/user.entity';

declare global {
  namespace Express {
    interface Multer {
      File: MulterFile;
    }

    interface MulterFile {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    }

    interface Request {
      user?: User;
    }
  }
} 