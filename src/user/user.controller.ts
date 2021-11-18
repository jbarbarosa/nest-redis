import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/login')
  create(@Headers() credentials: LoginDto) {
    const user = this.userService.login(credentials);
    const { refresh, acess } = this.userService.createTokens(user);
    this.userService.cacheRefreshToken(refresh);
    return { refresh, acess };
  }

  @Get('/refresh')
  refresh(@Headers('refresh_token') refresh: string) {
    return this.userService.validateRefreshToken(refresh);
  }

}
