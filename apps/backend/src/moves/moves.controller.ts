import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { MovesService } from './moves.service';
import { CreateMoveDto } from './dto/create-move.dto';
import { UpdateMoveDto } from './dto/update-move.dto';

@Controller('moves')
export class MovesController {
  constructor(private readonly movesService: MovesService) {}

  @Post()
  create(@Body() createMoveDto: CreateMoveDto) {
    return this.movesService.create(createMoveDto);
  }

  @Get()
  findAll() {
    return this.movesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.movesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateMoveDto: UpdateMoveDto
  ) {
    return this.movesService.update(id, updateMoveDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.movesService.remove(id);
  }
}