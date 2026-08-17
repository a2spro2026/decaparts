<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ClearTestDataCommand extends Command
{
    protected $signature = 'decaparts:clear-test-data {--force : Exécuter sans confirmation}';

    protected $description = 'Supprime les données métier de démonstration (conserve utilisateurs, rôles et permissions)';

    /** @var list<string> */
    private array $tables = [
        'client_payment_allocations',
        'client_payments',
        'supplier_payment_allocations',
        'supplier_payments',
        'client_invoice_items',
        'client_invoices',
        'supplier_invoice_items',
        'supplier_invoices',
        'sales_order_items',
        'sales_orders',
        'client_order_items',
        'client_orders',
        'quote_items',
        'quotes',
        'purchase_order_items',
        'purchase_orders',
        'stock_movements',
        'stock_transfers',
        'payments',
        'employee_payments',
        'employee_advances',
        'attendances',
        'tasks',
        'chantier_assignments',
        'chantier_besoins',
        'documents',
        'expenses',
        'charges',
        'monetary_transactions',
        'notifications',
        'products',
        'product_categories',
        'chantiers',
        'employees',
        'clients',
        'suppliers',
        'personal_access_tokens',
    ];

    public function handle(): int
    {
        if (! $this->option('force') && ! $this->confirm('Supprimer toutes les données métier de test ?', true)) {
            $this->warn('Opération annulée.');

            return self::SUCCESS;
        }

        Schema::disableForeignKeyConstraints();

        foreach ($this->tables as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            DB::table($table)->truncate();
            $this->line("  vidé : {$table}");
        }

        Schema::enableForeignKeyConstraints();

        $this->info('Données de test supprimées. Comptes utilisateurs et rôles conservés.');

        return self::SUCCESS;
    }
}
