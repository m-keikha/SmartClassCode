// services/translation.service.ts
export interface WordTranslation {
    word: string;
    translate: string;
    dependent_phrase?: string;
    translate_dependent_phrase?: string;
}

export interface TranslationResponse {
    words: WordTranslation[];
    completeTranslation: string;
}

export interface TranslationApiResponse {
    data: TranslationResponse;
}

export interface TranslationError {
    error: string;
}


export class TranslationService {
    private static readonly API_URL = '/api/translate-advaced';

    static async translateText(text: string[]): Promise<TranslationApiResponse> {
        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                const errorData: TranslationError = await response.json();
                throw new Error(errorData.error || 'Translation failed');
            }

            const data: TranslationApiResponse = await response.json();
            return data;

        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            }
            throw new Error('An unexpected error occurred');
        }
    }
}