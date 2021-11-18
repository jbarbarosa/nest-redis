import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { decode, sign, verify } from 'jsonwebtoken';
import { createClient } from 'redis';
import { getUnixTime, subDays } from 'date-fns'

@Injectable()
export class UserService {

  private users: User[] = [
    {
      id: 1,
      username: 'elvis',
      password: 'presley',
      permissions: [
        1, 2
      ]
    },
    {
      id: 2,
      username: 'joao',
      password: 'barbosa',
      permissions: [
        2, 3
      ]
    }
  ]

  login(credentials: LoginDto) {
    const user = this.findByUsername(credentials.username);
    if(!user) throw new Error('no user');
    const match = this.checkPassword(user.password, credentials.password);
    if(!match) throw new Error('wrong password');
    return user;
  }

  private async createRedisConnection() {
    try {
      const client = createClient();
      client.on('error', (err) => console.log('Redis Client Error', err));
      await client.connect();
      return client;
    } catch(e) {
      console.log(e);
    }
  }

  public async cacheRefreshToken(token: string) {
    try {
      const { id } = decode(token) as DecodedRefreshToken;
      const connection = await this.createRedisConnection();
      const res = await connection.sendCommand(['ZADD', String(id), String(0), token]);
      console.log('res ', res);
      return res;
    } catch(e) {
      console.log(e);
    }
  }

  public createTokens(user: User) {
    const { id } = user;
    const refresh = sign({ id }, 'secret', { expiresIn: '7d' });
    const acess = sign(user, 'secret', { expiresIn: '20s' });
    return { acess, refresh }
  }

  private checkPassword(submitted: string, retrieved: string) {
    return submitted === retrieved ? true : false;
  }

  private findByUsername(username: string) {
    let result: User = undefined;
    this.users.forEach((user) => {
      if(user.username == username) return result = user;
    })
    return result;
  }

  public async validateRefreshToken(refresh: string) {
    try {
      const { id, exp } = verify(refresh, 'secret') as DecodedRefreshToken;
      const sevenDaysAgo = getUnixTime(subDays(new Date(), 7));
      console.log('aa', sevenDaysAgo);
      const result = await (await this.createRedisConnection()).sendCommand(['ZRANGE', String(id), '0', String(sevenDaysAgo), 'WITHSCORES']);
      return result;
    } catch(e) {
      console.log(e);
    }
  }
}

export class User {
  public id: number;
  public username: string;
  public password: string;
  public permissions: number[];
}

export class Tokens {
  public access: string;
  public refresh: string;
}

export class DecodedRefreshToken {
  public id: number;
  public iat: number;
  public exp: number;
}