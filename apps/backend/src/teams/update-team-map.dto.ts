// apps/backend/src/teams/dto/update-team-map.dto.ts
import { IsArray, IsNotEmpty } from 'class-validator';

export class UpdateTeamMapDto {
  @IsArray()
  @IsNotEmpty()
  nodes: any[]; // Podrías tiparlo más estricto, pero 'any[]' para el JSON de React Flow es lo más práctico

  @IsArray()
  @IsNotEmpty()
  edges: any[];
}