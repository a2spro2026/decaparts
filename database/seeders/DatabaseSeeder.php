<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $adminRole = Role::where('slug', 'administrateur')->first();

        User::where('email', 'admin@decaparts.ma')->update([
            'email' => 'admin@decaparts.com',
        ]);

        // Le compte administrateur propriétaire est créé via `php artisan decaparts:owner-admin`.
        User::firstOrCreate(
            ['email' => 'admin@decaparts.com'],
            [
                'name' => 'MR AHMED',
                'password' => Hash::make(Str::random(32)),
                'role_id' => $adminRole->id,
                'statut' => 'Gerant',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
