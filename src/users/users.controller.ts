import { Body, Controller, Get, Inject, Post, Put, UploadedFile, UseGuards, UseInterceptors, forwardRef } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('用户')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ApiOperation({ 
    summary: '用户注册', 
    description: '创建新用户并返回用户信息和JWT令牌。示例用户名: testuser, 密码: test123456'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['username', 'password', 'nickname'],
      properties: {
        username: { type: 'string', example: 'testuser' },
        password: { type: 'string', example: 'test123456' },
        nickname: { type: 'string', example: '测试用户' },
        avatar: { 
          type: 'string', 
          format: 'binary',
          description: '可选的用户头像，如不上传将使用默认头像'
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 400, description: '用户名已被占用' })
  @UseInterceptors(FileInterceptor('avatar'))
  async register(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() avatar: Express.Multer.File,
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
  @ApiOperation({ 
    summary: '用户登录', 
    description: '使用用户名和密码登录并返回JWT令牌。示例用户名: testuser, 密码: test123456，或使用测试用户: test/test123456'
  })
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
  @ApiResponse({ status: 200, description: '头像更新成功' })
  @ApiResponse({ status: 400, description: '头像URL不能为空' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '用户未找到' })
  async updateAvatar(
    @GetUser('_id') userId: string,
    @Body() updateAvatarDto: UpdateAvatarDto,
  ) {
    const updatedUser = await this.usersService.updateAvatar(userId, updateAvatarDto);
    
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