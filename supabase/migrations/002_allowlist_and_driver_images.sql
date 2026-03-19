-- ============================================================
-- EMAIL ALLOWLIST — restrict signups to approved friends
-- ============================================================
CREATE TABLE allowed_signup_emails (
  email TEXT PRIMARY KEY,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.hook_allowlist_signup(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  signup_email TEXT;
  is_allowed BOOLEAN;
BEGIN
  signup_email := lower((event -> 'user' ->> 'email'));

  SELECT EXISTS (
    SELECT 1 FROM public.allowed_signup_emails
    WHERE lower(email) = signup_email
  ) INTO is_allowed;

  IF is_allowed THEN
    RETURN '{}'::jsonb;
  ELSE
    RETURN jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'This email is not authorized to sign up. Ask the admin to add you.'
      )
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hook_allowlist_signup TO supabase_auth_admin;
GRANT SELECT ON TABLE public.allowed_signup_emails TO supabase_auth_admin;

REVOKE EXECUTE ON FUNCTION public.hook_allowlist_signup FROM authenticated, anon;

-- ============================================================
-- DRIVER IMAGES — headshot URL + team hex color from OpenF1
-- ============================================================
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS headshot_url TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS team_colour TEXT;

UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png.transform/1col/image.png', team_colour = 'F47600' WHERE code = 'NOR';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png.transform/1col/image.png', team_colour = '4781D7' WHERE code = 'VER';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GABBOR01_Gabriel_Bortoleto/gabbor01.png.transform/1col/image.png', team_colour = 'F50537' WHERE code = 'BOR';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/I/ISAHAD01_Isack_Hadjar/isahad01.png.transform/1col/image.png', team_colour = '4781D7' WHERE code = 'HAD';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/P/PIEGAS01_Pierre_Gasly/piegas01.png.transform/1col/image.png', team_colour = '00A1E8' WHERE code = 'GAS';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/S/SERPER01_Sergio_Perez/serper01.png.transform/1col/image.png', team_colour = '909090' WHERE code = 'PER';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/K/ANDANT01_Kimi_Antonelli/andant01.png.transform/1col/image.png', team_colour = '00D7B6' WHERE code = 'ANT';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png.transform/1col/image.png', team_colour = '229971' WHERE code = 'ALO';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png.transform/1col/image.png', team_colour = 'ED1131' WHERE code = 'LEC';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png.transform/1col/image.png', team_colour = '229971' WHERE code = 'STR';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ALEALB01_Alexander_Albon/alealb01.png.transform/1col/image.png', team_colour = '1868DB' WHERE code = 'ALB';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/N/NICHUL01_Nico_Hulkenberg/nichul01.png.transform/1col/image.png', team_colour = 'F50537' WHERE code = 'HUL';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LIALAW01_Liam_Lawson/lialaw01.png.transform/1col/image.png', team_colour = '6C98FF' WHERE code = 'LAW';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/E/ESTOCO01_Esteban_Ocon/estoco01.png.transform/1col/image.png', team_colour = '9C9FA2' WHERE code = 'OCO';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ARVLIN01_Arvid_Lindblad/arvlin01.png.transform/1col/image.png', team_colour = '6C98FF' WHERE code = 'LIN';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FRACOL01_Franco_Colapinto/fracol01.png.transform/1col/image.png', team_colour = '00A1E8' WHERE code = 'COL';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png.transform/1col/image.png', team_colour = 'ED1131' WHERE code = 'HAM';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png.transform/1col/image.png', team_colour = '1868DB' WHERE code = 'SAI';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png.transform/1col/image.png', team_colour = '00D7B6' WHERE code = 'RUS';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/V/VALBOT01_Valtteri_Bottas/valbot01.png.transform/1col/image.png', team_colour = '909090' WHERE code = 'BOT';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png.transform/1col/image.png', team_colour = 'F47600' WHERE code = 'PIA';
UPDATE drivers SET headshot_url = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OLIBEA01_Oliver_Bearman/olibea01.png.transform/1col/image.png', team_colour = '9C9FA2' WHERE code = 'BEA';
