import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Pagination } from 'nestjs-typeorm-paginate';
import path = require('path');
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { hasRoles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { User, UserRole } from '../models/user.interface';
import { UserService } from '../service/user.service';
import { join } from 'path';
import { UserIsUser } from 'src/auth/guards/UserIsUser.guard';

@Controller('users')
export class UserController {
    constructor(private userService: UserService){}

    @Post()
    create (@Body() user: User): Observable<User|Object>{
        return this.userService.create(user).pipe(
            map((user: User) => user),
            catchError(error => of({ error: error.message }))
        );
    }

    @Post('login')
    login(@Body() user: User): Observable<Object> {
        return this.userService.login(user).pipe(
            map((jwt: string) => { return { access_token: jwt }  })
        )
    }

    @Get(':id')
    findOne (@Param() params): Observable<User>{
        return this.userService.findOne(params.id);
    }

    @hasRoles(UserRole.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get()
    index (@Query('page') page: number = 1, @Query('limit') limit: number = 10, @Query('username') username: string): Observable<Pagination<User>> {
        limit = limit > 100 ? 100 : limit;
        if (username === null || username === undefined) {
            return this.userService.paginate({ page: Number(page), limit: Number(limit), route: 'http://localhost:3000/api/users' });
        } else {
            return this.userService.paginateFilterByUsername(
                { page: Number(page), limit: Number(limit), route: 'http://localhost:3000/api/users' },
                { username }
            )
        }
    }

    @Delete(':id')
    deleteOne (@Param('id') id: string): Observable<any> {
        return this.userService.delete(Number(id));
    }
    @UseGuards(JwtAuthGuard, UserIsUser)
    @Put(':id')
    updateOne (@Param('id') id: string, @Body() user: User): Observable<any> {
        return this.userService.updateOne(Number(id), user);
    }

    @hasRoles(UserRole.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Put(':id/role')
    updateRoleOfUser(@Param('id') id: string, @Body() user: User): Observable<User> {
        return this.userService.updateRoleOfUser(Number(id), user);
    }

    @UseGuards(JwtAuthGuard)
    @Post("upload")
    @UseInterceptors(FileInterceptor("file", {
        storage: diskStorage({
            destination: "./uploads/profileimages",
            filename: (req, file, cb) => {
                const filename: string = path.parse(file.originalname).name.replace(/\s/, '') + uuidv4();
                const ext: string = path.parse(file.originalname).ext;

                cb(null, `${filename}.${ext}`); 
            }
        })
    }))
    uploadFile(@UploadedFile() file, @Request() req): Observable<Object> {
        const user: User = req.user.user;
        // console.log(req);
        return this.userService.updateOne(user.id, { profileImage: file.filename }).pipe(
            tap((user: User) => console.log(user)),
            map((user: User) => ({ profileImage: user.profileImage }))
        )
    }

    @Get('profile-image/:imagename')
    findProfileImage(@Param('imagename') imagename, @Res() res): Observable<Object> {
        return of(res.sendFile(join(process.cwd(), 'uploads/profileimages/' + imagename)))
    }
}
