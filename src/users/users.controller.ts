import { Body, Controller, Get, Inject, Post, Put, UploadedFile, UseGuards, UseInterceptors, forwardRef } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { imageFileFilter } from '../utils/file-upload.utils';

@ApiTags('用户')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'testuser' },
        password: { type: 'string', example: 'password123' },
        nickname: { type: 'string', example: '测试用户' },
        avatar: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 400, description: '注册失败，用户已存在或数据无效' })
  @UseInterceptors(
    FileInterceptor('avatar', {
      fileFilter: imageFileFilter,
    }),
  )
  async register(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() avatar: any,
  ) {
    const user = await this.usersService.create(createUserDto, avatar);
    
    return {
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
        token: this.authService.generateToken(String(user._id)),
      },
    };
  }

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '无效的用户名或密码' })
  async login(@Body() loginUserDto: LoginUserDto) {
    const user = await this.authService.validateUser(
      loginUserDto.username,
      loginUserDto.password,
    );
    
    return {
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
        token: this.authService.generateToken(String(user._id)),
      },
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户个人资料' })
  @ApiResponse({ status: 200, description: '成功获取用户资料' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '用户未找到' })
  async getUserProfile(@GetUser() user: User) {
    return {
      success: true,
      data: user,
    };
  }

  @Put('avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新用户头像' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '头像更新成功' })
  @ApiResponse({ status: 400, description: '请上传头像图片' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '用户未找到' })
  @UseInterceptors(
    FileInterceptor('avatar', {
      fileFilter: imageFileFilter,
    }),
  )
  async updateAvatar(
    @GetUser('_id') userId: string,
    @UploadedFile() avatar: any,
  ) {
    const updatedUser = await this.usersService.updateAvatar(userId, avatar);
    
    return {
      success: true,
      data: updatedUser,
    };
  }

  @Put('nickname')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新用户昵称' })
  @ApiResponse({ status: 200, description: '昵称更新成功' })
  @ApiResponse({ status: 400, description: '昵称不能为空' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '用户未找到' })
  async updateNickname(
    @GetUser('_id') userId: string,
    @Body() updateNicknameDto: UpdateNicknameDto,
  ) {
    const updatedUser = await this.usersService.updateNickname(
      userId,
      updateNicknameDto,
    );
    
    return {
      success: true,
      data: updatedUser,
    };
  }
} 