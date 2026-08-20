<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\ProductStockCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductApiController extends Controller
{
    public function __construct(private ProductStockCalculator $stockCalculator) {}

    public function index(Request $request)
    {
        $query = Product::query()
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('reference', 'like', "%{$s}%")
                    ->orWhere('article_id', 'like', "%{$s}%")
                    ->orWhere('famille', 'like', "%{$s}%");
            }))
            ->orderBy('id');

        if ($request->boolean('all')) {
            $products = $query->get()->map(fn ($p) => $this->formatProduct($p));
            $familles = Product::whereNotNull('famille')
                ->where('famille', '!=', '')
                ->distinct()
                ->orderBy('famille')
                ->pluck('famille')
                ->values();

            return response()->json([
                'data' => $products,
                'meta' => [
                    'next_ref' => $this->nextReference(),
                    'familles' => $familles,
                ],
            ]);
        }

        return response()->json(
            $query->paginate(15)->through(fn ($p) => $this->formatProduct($p))
        );
    }

    public function store(Request $request)
    {
        $validated = $this->validated($request);
        $initialStock = (float) ($validated['initial_stock'] ?? 0);
        $reference = trim((string) ($validated['reference'] ?? ''));

        $product = DB::transaction(function () use ($validated, $initialStock, $reference) {
            $product = Product::create([
                ...$validated,
                'reference' => $reference !== '' ? $reference : 'Réf-PENDING',
                'quantity_in_stock' => $initialStock,
                'min_stock_alert' => $validated['min_stock_alert'] ?? 0,
                'etat' => $validated['etat'] ?? 'Rupture',
                'origin' => 'saisie',
            ]);

            if ($reference === '') {
                $product->update(['reference' => $this->referenceFor($product->id)]);
            }

            return $product;
        });

        return response()->json($this->formatProduct($product), 201);
    }

    public function show(Product $product)
    {
        return response()->json($this->formatProduct($product));
    }

    public function update(Request $request, Product $product)
    {
        $validated = $this->validated($request, $product->id);

        if (array_key_exists('initial_stock', $validated)) {
            $validated['quantity_in_stock'] = (float) $validated['initial_stock'];
        }

        $product->update($validated);

        return response()->json($this->formatProduct($product->fresh()));
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json(['message' => 'Produit supprimé']);
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $articleUnique = 'unique:products,article_id';
        $refUnique = 'unique:products,reference';
        if ($ignoreId) {
            $articleUnique .= ','.$ignoreId;
            $refUnique .= ','.$ignoreId;
        }

        return $request->validate([
            'reference' => 'required|string|max:100|'.$refUnique,
            'name' => 'required|string|max:500',
            'article_id' => 'nullable|string|max:50|'.$articleUnique,
            'consistance' => 'nullable|string|max:10',
            'unit' => 'required|string|in:Kg,U,Sac,ML,M²,M³,Tn,M',
            'famille' => 'nullable|string|max:255',
            'initial_stock' => 'numeric|min:0',
            'min_stock_alert' => 'nullable|numeric|min:0',
            'status' => 'in:actif,inactif',
            'etat' => 'nullable|in:Dispo,Faible,Rupture',
        ]);
    }

    private function nextReference(): string
    {
        return $this->referenceFor((Product::max('id') ?? 0) + 1);
    }

    private function referenceFor(int $id): string
    {
        return 'Réf-'.str_pad((string) $id, 4, '0', STR_PAD_LEFT);
    }

    private function formatProduct(Product $product): array
    {
        $stock = $this->stockCalculator->forProduct($product, sync: true);
        $purchased = $stock['purchased'];
        $sold = $stock['sold'];
        $quantity = $stock['quantity'];
        $stockActuel = $stock['stock_actuel'];
        $etat = $stock['etat'];
        $origin = $stock['origin'];

        return [
            'id' => $product->id,
            'reference' => $product->reference,
            'article_id' => $product->article_id,
            'name' => $product->name,
            'designation' => $product->name,
            'consistance' => $product->consistance,
            'unit' => $product->unit,
            'famille' => $product->famille,
            'brand' => $product->brand,
            'initial_stock' => (float) $product->initial_stock,
            'stock_initial' => (float) $product->initial_stock,
            'quantity' => $quantity,
            'purchased_qty' => $purchased,
            'sold_qty' => $sold,
            'stock_actuel' => $stockActuel,
            'quantity_in_stock' => $stockActuel,
            'min_stock_alert' => (float) $product->min_stock_alert,
            'status' => $product->status,
            'statut' => $product->status === 'actif' ? 'Actif' : 'Inactif',
            'etat' => $etat,
            'origin' => $origin,
            'origin_label' => $origin === 'bon_achat' ? 'Bon d\'achat' : 'Saisie',
            'created_at' => $product->created_at?->format('d/m/Y'),
        ];
    }
}
