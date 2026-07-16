# Value Scout AI V1.1

Projeto Next.js pronto para Vercel.

## Recursos
- Jogos reais por data via API-Football.
- Últimos 5 e 10 jogos.
- Editor de linhas e odds da Bet365.
- Chutes, chutes certos, escanteios, cartões e gols.
- Score, projeção, taxa recente, odd justa e EV inicial.
- Salvamento local quando Supabase não está configurado.
- Salvamento no Supabase quando configurado.

## Variáveis da Vercel
Obrigatória:
- API_FOOTBALL_KEY

Opcionais para histórico em nuvem:
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

## Banco
Execute `supabase/schema.sql` no SQL Editor do Supabase.

## Publicação
1. Suba esta pasta em um repositório GitHub.
2. Importe o repositório na Vercel.
3. Cadastre as variáveis.
4. Deploy.

## Limitações
- Cobertura varia por competição.
- API gratuita tem limite de chamadas.
- Odds exatas são inseridas manualmente.
- Score será calibrado com os resultados reais.
