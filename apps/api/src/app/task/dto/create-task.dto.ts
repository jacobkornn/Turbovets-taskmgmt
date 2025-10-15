import { IsString, IsOptional, IsIn, IsInt } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsIn(['todo', 'in-progress', 'done', 'blocked'])
  status: 'todo' | 'in-progress' | 'done' | 'blocked';

  @IsOptional()
  @IsInt()
  assignedTo?: number;
}

