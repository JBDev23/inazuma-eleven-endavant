import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, Patch } from '@nestjs/common';
import { MarketService } from './market.service';
import { LoginDto } from './dto/login.dto';
import { BuyFormationDto } from './dto/buy-formation.dto';
import { ActivateFormationDto } from './dto/activate-formation.dto';
import { UpdateRosterDto } from './dto/update-roster.dto';
import { AddTransactionDto } from './dto/add-transaction.dto';
import { RedeemPeDto } from './dto/redeem-pe.dto';
import { RedeemYeDto } from './dto/redeem-ye.dto';
import { SpendPcDto } from './dto/spend-pc.dto';
import { StartFacilityUpgradeDto, AdminUpdateFacilityDto, SetPitchElementDto } from './dto/sports-city.dto';
import { CreateUserClubDto } from './dto/create-user-club.dto';
import { UpdateUserClubDto } from './dto/update-user-club.dto';

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.marketService.login(loginDto);
  }
  
  @Get('user-clubs')
  async getUserClubs(@Query('forResources') forResources?: string) {
    return this.marketService.getUserClubs({
      forResources: forResources === '1' || forResources === 'true',
    });
  }

  @Post('user-clubs')
  async createUserClub(@Body() body: CreateUserClubDto) {
    return this.marketService.createUserClub(body);
  }

  @Delete('user-clubs/:clubId')
  @HttpCode(HttpStatus.OK)
  async deleteUserClub(@Param('clubId') clubId: string) {
    return this.marketService.deleteUserClub(clubId);
  }

  @Get('club/:clubId')
  async getClub(@Param('clubId') clubId: string) {
    return this.marketService.getUserClub(clubId);
  }
  
  @Get(':clubId/map/:teamSlug')
  async getTeamMapForUser(
    @Param('clubId') clubId: string,
    @Param('teamSlug') teamSlug: string,
    @Query('sourceTeamSlug') sourceTeamSlug?: string
  ) {
    return this.marketService.calculateMapState(clubId, teamSlug, sourceTeamSlug);
  }

  @Post('debug/toggle-player')
  @HttpCode(HttpStatus.OK)
  async debugTogglePlayer(
    @Body() body: { clubId: string; nickname: string; action: 'buy' | 'sell' | 'make-rival-toll' }
  ) {
    return this.marketService.debugTogglePlayer(body.clubId, body.nickname, body.action);
  }

  @Post(':clubId/action')
  async performMarketAction(
    @Param('clubId') clubId: string,
    @Body() body: { action: 'buy' | 'toll' | 'sell'; nickname: string }
  ) {
    return this.marketService.performMarketAction(clubId, body.nickname, body.action);
  }

  @Patch('user-clubs/:clubId')
  async updateUserClub(@Param('clubId') clubId: string, @Body() body: UpdateUserClubDto) {
    return this.marketService.updateUserClub(clubId, body);
  }

  @Post('user-clubs/:clubId/transactions')
  @HttpCode(HttpStatus.OK)
  async addTransaction(
    @Param('clubId') clubId: string,
    @Body() body: AddTransactionDto,
  ) {
    return this.marketService.addTransaction(clubId, body);
  }

  @Patch(':clubId/roster')
  async updateRoster(@Param('clubId') clubId: string, @Body() body: UpdateRosterDto) {
    return this.marketService.updateRoster(clubId, body.roster);
  }

  @Get('free-agents')
  async getFreeAgents() {
    return this.marketService.getFreeAgents();
  }

  @Get('free-coaches')
  async getFreeCoaches() {
    return this.marketService.getFreeCoaches();
  }

  @Post(':clubId/coaches/buy')
  @HttpCode(HttpStatus.OK)
  async buyCoach(
    @Param('clubId') clubId: string,
    @Body() body: { coachId: number },
  ) {
    return this.marketService.buyCoach(clubId, body.coachId);
  }

  @Post(':clubId/coaches/sell')
  @HttpCode(HttpStatus.OK)
  async sellCoach(
    @Param('clubId') clubId: string,
    @Body() body: { coachId: number },
  ) {
    return this.marketService.sellCoach(clubId, body.coachId);
  }

  @Get('formations')
  async getFormationCatalog() {
    return this.marketService.getFormationCatalog();
  }

  @Get(':clubId/formations')
  async getClubFormations(@Param('clubId') clubId: string) {
    return this.marketService.getClubFormations(clubId);
  }

  @Post(':clubId/formations/buy')
  @HttpCode(HttpStatus.OK)
  async buyFormation(
    @Param('clubId') clubId: string,
    @Body() body: BuyFormationDto,
  ) {
    return this.marketService.buyFormation(clubId, body.formationId);
  }

  @Patch(':clubId/formations/active')
  async activateFormation(
    @Param('clubId') clubId: string,
    @Body() body: ActivateFormationDto,
  ) {
    return this.marketService.activateFormation(clubId, body.formationId);
  }

  @Post('user-clubs/:clubId/formations/grant')
  @HttpCode(HttpStatus.OK)
  async adminGrantFormation(
    @Param('clubId') clubId: string,
    @Body() body: BuyFormationDto,
  ) {
    return this.marketService.adminGrantFormation(clubId, body.formationId);
  }

  @Post('user-clubs/:clubId/formations/revoke')
  @HttpCode(HttpStatus.OK)
  async adminRevokeFormation(
    @Param('clubId') clubId: string,
    @Body() body: BuyFormationDto,
  ) {
    return this.marketService.adminRevokeFormation(clubId, body.formationId);
  }

  @Post(':clubId/pe/preview')
  @HttpCode(HttpStatus.OK)
  async previewPeRedemption(
    @Param('clubId') clubId: string,
    @Body() body: RedeemPeDto,
  ) {
    return this.marketService.previewPeRedemption(clubId, body.allocations);
  }

  @Post(':clubId/pe/redeem')
  @HttpCode(HttpStatus.OK)
  async redeemPe(
    @Param('clubId') clubId: string,
    @Body() body: RedeemPeDto,
  ) {
    return this.marketService.redeemPe(clubId, body.allocations);
  }

  @Post(':clubId/ye/preview')
  @HttpCode(HttpStatus.OK)
  async previewYeRedemption(
    @Param('clubId') clubId: string,
    @Body() body: RedeemYeDto,
  ) {
    return this.marketService.previewYeRedemption(clubId, body.allocations);
  }

  @Post(':clubId/ye/redeem')
  @HttpCode(HttpStatus.OK)
  async redeemYe(
    @Param('clubId') clubId: string,
    @Body() body: RedeemYeDto,
  ) {
    return this.marketService.redeemYe(clubId, body.allocations);
  }

  @Post(':clubId/pc/spend')
  @HttpCode(HttpStatus.OK)
  async spendPc(
    @Param('clubId') clubId: string,
    @Body() body: SpendPcDto,
  ) {
    return this.marketService.spendPc(clubId, body.playerId, body.statKey, body.amount ?? 1);
  }

  @Get('items')
  async getItemCatalog() {
    return this.marketService.getItemCatalog();
  }

  @Get(':clubId/items')
  async getClubItems(@Param('clubId') clubId: string) {
    return this.marketService.getClubItems(clubId);
  }

  @Post(':clubId/items/buy')
  @HttpCode(HttpStatus.OK)
  async buyItem(
    @Param('clubId') clubId: string,
    @Body() body: { itemId: number },
  ) {
    return this.marketService.buyItem(clubId, body.itemId);
  }

  @Patch(':clubId/players/equipment')
  async equipItem(
    @Param('clubId') clubId: string,
    @Body() body: import('@inazuma/shared').EquipItemDto,
  ) {
    return this.marketService.equipItem(clubId, body);
  }

  @Get('consumables')
  async getConsumableCatalog() {
    return this.marketService.getConsumableCatalog();
  }

  @Get(':clubId/consumables')
  async getClubConsumables(@Param('clubId') clubId: string) {
    return this.marketService.getClubConsumables(clubId);
  }

  @Post(':clubId/consumables/buy')
  @HttpCode(HttpStatus.OK)
  async buyConsumable(
    @Param('clubId') clubId: string,
    @Body() body: { consumableId: number },
  ) {
    return this.marketService.buyConsumable(clubId, body.consumableId);
  }

  @Get('sports-cities')
  async getAllSportsCities() {
    return this.marketService.getAllSportsCities();
  }

  @Get(':clubId/sports-city')
  async getSportsCity(@Param('clubId') clubId: string) {
    return this.marketService.getSportsCity(clubId);
  }

  @Post(':clubId/sports-city/upgrade')
  @HttpCode(HttpStatus.OK)
  async startFacilityUpgrade(
    @Param('clubId') clubId: string,
    @Body() body: StartFacilityUpgradeDto,
  ) {
    return this.marketService.startFacilityUpgrade(clubId, body.facilityId);
  }

  @Patch(':clubId/sports-city/pitch-element')
  @HttpCode(HttpStatus.OK)
  async setPitchElement(
    @Param('clubId') clubId: string,
    @Body() body: SetPitchElementDto,
  ) {
    return this.marketService.setPitchElement(clubId, body.pitchElement);
  }

  @Patch('sports-city/:clubId')
  async adminUpdateFacility(
    @Param('clubId') clubId: string,
    @Body() body: AdminUpdateFacilityDto,
  ) {
    return this.marketService.adminUpdateFacility(clubId, body.facilityId, {
      level: body.level,
      approveConstruction: body.approveConstruction,
    });
  }
}
