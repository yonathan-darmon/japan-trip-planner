import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from './entities/country.entity';

@Injectable()
export class CountriesService {
    constructor(
        @InjectRepository(Country)
        private countriesRepository: Repository<Country>,
    ) { }

    async findAll(): Promise<Country[]> {
        return this.countriesRepository.find();
    }

    async findOne(id: number): Promise<Country | null> {
        return this.countriesRepository.findOneBy({ id });
    }

    async create(createCountryDto: { name: string; code: string }): Promise<Country> {
        const country = this.countriesRepository.create(createCountryDto);
        return this.countriesRepository.save(country);
    }

    async assignSuggestions(countryId: number, suggestionIds: number[]): Promise<void> {
        const country = await this.findOne(countryId);
        if (!country) {
            throw new Error('Country not found');
        }
        // We need to update suggestions. We can use QueryBuilder or inject Suggestions repo.
        // However, to avoid circular dependencies if SuggestionsModule imports CountriesModule,
        // it's cleaner to handle this here if we inject EntityManager or SuggestionsRepository.
        // For now, let's use EntityManager to be safe and quick.
        await this.countriesRepository.manager.createQueryBuilder()
            .update('suggestions')
            .set({ countryId: country.id })
            .whereInIds(suggestionIds)
            .execute();
    }
}
