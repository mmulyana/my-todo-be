import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
import { AttachmentType } from './models/attachment.model';

@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  create(@Body() createAttachmentDto: CreateAttachmentDto) {
    return this.attachmentsService.create(createAttachmentDto);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  uploadFile(
    @UploadedFile() file: any,
    @Body('todoId') todoId?: string,
    @Body('projectId') projectId?: string,
    @Body('type') type?: AttachmentType,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const fileUrl = `/uploads/${file.filename}`;

    return this.attachmentsService.create({
      filename: file.originalname,
      url: fileUrl,
      mimeType: file.mimetype,
      size: file.size,
      type,
      todoId: todoId || null,
      projectId: projectId || null,
    });
  }

  @Get()
  findAll(
    @Query('todoId') todoId?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.attachmentsService.findAll(todoId, projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attachmentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAttachmentDto: UpdateAttachmentDto,
  ) {
    return this.attachmentsService.update(id, updateAttachmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attachmentsService.remove(id);
  }
}
