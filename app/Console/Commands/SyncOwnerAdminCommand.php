<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class SyncOwnerAdminCommand extends Command
{
    protected $signature = 'decaparts:owner-admin';

    protected $description = 'Crée ou met à jour le compte administrateur propriétaire (identifiants lus depuis l\'environnement du processus)';

    public function handle(): int
    {
        // Lus depuis l'environnement du processus uniquement : jamais stockés dans .env ni dans le dépôt.
        $login = trim((string) getenv('DECAPARTS_OWNER_LOGIN'));
        $password = (string) getenv('DECAPARTS_OWNER_PASSWORD');

        if ($login === '' || $password === '') {
            $this->error('DECAPARTS_OWNER_LOGIN et DECAPARTS_OWNER_PASSWORD doivent être définis.');

            return self::FAILURE;
        }

        $email = str_contains($login, '@') ? $login : $login.'@decaparts.com';
        $adminRole = Role::where('slug', 'administrateur')->first();

        if (! $adminRole) {
            $this->error('Rôle administrateur introuvable — lancez d\'abord le RoleSeeder.');

            return self::FAILURE;
        }

        User::where('is_owner', true)->where('email', '!=', $email)->update(['is_owner' => false]);

        $user = User::firstOrNew(['email' => $email]);
        $user->fill([
            'name' => $user->name ?: 'Administrateur',
            'password' => Hash::make($password),
            'role_id' => $adminRole->id,
            'statut' => null,
            'is_active' => true,
        ]);
        $user->is_owner = true;
        $user->email_verified_at ??= now();
        $user->save();

        $user->tokens()->delete();

        $this->info('Compte administrateur propriétaire synchronisé.');

        return self::SUCCESS;
    }
}
