-- Todas as colunas são opcionais (aceitam NULL), para que os pacientes
-- já cadastrados continuem válidos.
ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS cep        VARCHAR(8),
  ADD COLUMN IF NOT EXISTS logradouro VARCHAR(150),
  ADD COLUMN IF NOT EXISTS cidade     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS uf         CHAR(2);
