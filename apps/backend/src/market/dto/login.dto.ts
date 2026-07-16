import { IsString } from "class-validator";

export class LoginDto {
    @IsString()
    clubId!: string;

    @IsString()
    pin!: string;
}