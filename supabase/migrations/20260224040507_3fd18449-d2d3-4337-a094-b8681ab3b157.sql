UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'robertaferreirasena@gmail.com' AND email_confirmed_at IS NULL;