import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'Mesaj icerigi', maxLength: 2000 })
  @IsString()
  @IsNotEmpty({ message: 'Mesaj bos olamaz' })
  @MaxLength(2000, { message: 'Mesaj en fazla 2000 karakter olabilir' })
  content: string;
}
