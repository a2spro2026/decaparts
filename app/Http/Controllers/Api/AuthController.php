<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const STATUTS = [
        'Gerant' => 'Gérant',
        'Assistant' => 'Assistant(e)',
        'Commercial' => 'Commercial',
        'Facturation' => 'Facturation',
    ];

    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required|string',
            'password' => 'required|string',
            'statut' => 'nullable|in:'.implode(',', array_keys(self::STATUTS)),
        ]);

        $user = User::with('role.permissions')
            ->where('email', $request->login)
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Statut, login ou mot de passe incorrect.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'login' => ['Compte suspendu.'],
            ]);
        }

        if (! $user->isOwner()) {
            if (! $request->filled('statut')) {
                throw ValidationException::withMessages([
                    'statut' => ['Veuillez sélectionner un statut.'],
                ]);
            }

            if (($user->statut ?? '') !== $request->statut) {
                throw ValidationException::withMessages([
                    'statut' => ['Le statut ne correspond pas à ce compte.'],
                ]);
            }
        }

        $token = $user->createToken('decaparts-spa')->plainTextToken;
        $statut = $user->isOwner() ? null : $user->statut;
        $statutLabel = $statut ? (self::STATUTS[$statut] ?? $statut) : null;

        return response()->json([
            'token' => $token,
            'user' => $this->formatUser($user, $statut, $statutLabel),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté']);
    }

    public function user(Request $request)
    {
        $user = $request->user()->load('role.permissions');
        $statut = $user->statut;
        $statutLabel = $statut ? (self::STATUTS[$statut] ?? $statut) : null;

        return response()->json($this->formatUser($user, $statut, $statutLabel));
    }

    private function formatUser(User $user, ?string $statut = null, ?string $statutLabel = null): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'login' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role?->only(['id', 'name', 'slug']),
            'permissions' => $user->role?->permissions->pluck('slug') ?? [],
            'is_admin' => $user->isAdmin(),
            'is_owner' => $user->isOwner(),
            'statut' => $user->isOwner() ? null : ($statut ?? $user->statut),
            'statut_label' => $user->isOwner() ? null : ($statutLabel ?? (self::STATUTS[$user->statut] ?? $user->statut)),
            'title' => $user->isOwner()
                ? 'Directeur Général'
                : ($statutLabel
                    ?? (self::STATUTS[$user->statut] ?? null)
                    ?? ($user->isAdmin() ? 'Directeur Général' : ($user->role?->name ?? ''))),
        ];
    }
}
