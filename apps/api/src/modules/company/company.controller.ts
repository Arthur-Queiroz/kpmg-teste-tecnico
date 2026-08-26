import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ErrorResponseDto } from '../../common/dto/error-response.dto';

import { CompanyService } from './company.service';
import {
  CompanyListResponseDto,
  CompanyResponseDto,
} from './dto/company-response.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { ListCompaniesQueryDto } from './dto/list-companies-query.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('companies')
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastra uma empresa',
    description:
      'Persiste a empresa e dispara a notificação por e-mail para o grupo configurado. O envio é best-effort: a resposta 201 confirma a persistência, não a entrega do e-mail.',
  })
  @ApiCreatedResponse({
    description: 'Empresa cadastrada',
    type: CompanyResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Falha de validação (CNPJ inválido, CEP inválido, campo ausente)',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Já existe empresa com este CNPJ',
    type: ErrorResponseDto,
  })
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companyService.create(createCompanyDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista empresas',
    description:
      'Paginado. `search` casa nome, nome fantasia ou CNPJ (com ou sem máscara) e `state` filtra pela UF do endereço — ambos sobre o conjunto inteiro, não sobre a página.',
  })
  @ApiOkResponse({
    description: 'Página de empresas',
    type: CompanyListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação ou filtro inválidos',
    type: ErrorResponseDto,
  })
  findAll(@Query() query: ListCompaniesQueryDto) {
    return this.companyService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma empresa por id' })
  @ApiOkResponse({
    description: 'Empresa encontrada',
    type: CompanyResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Empresa não encontrada',
    type: ErrorResponseDto,
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza uma empresa',
    description:
      'Aceita atualização parcial. Não dispara e-mail — a notificação é só no cadastro, conforme o enunciado.',
  })
  @ApiOkResponse({
    description: 'Empresa atualizada',
    type: CompanyResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Falha de validação',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Empresa não encontrada',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Já existe empresa com este CNPJ',
    type: ErrorResponseDto,
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companyService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove uma empresa' })
  @ApiNoContentResponse({ description: 'Empresa removida' })
  @ApiNotFoundResponse({
    description: 'Empresa não encontrada',
    type: ErrorResponseDto,
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.remove(id);
  }
}
