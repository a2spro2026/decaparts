<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $adminRole = Role::where('slug', 'administrateur')->first();

        User::where('email', 'admin@decaparts.ma')->update([
            'email' => 'admin@decaparts.com',
        ]);

        User::updateOrCreate(
            ['email' => 'admin@decaparts.com'],
            [
                'name' => 'MR AHMED',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
                'phone' => '0600000000',
                'statut' => 'Gerant',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'yahya@decaparts.com'],
            [
                'name' => 'MR TAHA',
                'password' => Hash::make('0661755048'),
                'role_id' => $adminRole->id,
                'phone' => '0661755048',
                'statut' => 'Gerant',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
