<?php
header('Content-Type: application/json');

// Technical Side: BTD Backend Engine v2.0
$json = file_get_contents('php://input');
$request = json_decode($json, true);

if ($request && isset($request['action'])) {
    $ordersFile = 'orders.json';
    $productsFile = 'products.json';
    $otpFile = 'otps.json';

    // --- ORDER ACTIONS ---
    if ($request['action'] === 'place_order') {
        $orderData = $request['data'];
        $orders = file_exists($ordersFile) ? json_decode(file_get_contents($ordersFile), true) : [];
        $orders[] = $orderData;
        file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT));
        echo json_encode(['status' => 'success']);
        exit;
    }

    if ($request['action'] === 'get_orders') {
        echo file_exists($ordersFile) ? file_get_contents($ordersFile) : json_encode([]);
        exit;
    }

    if ($request['action'] === 'update_status') {
        $orders = json_decode(file_get_contents($ordersFile), true);
        foreach ($orders as &$order) {
            if ($order['id'] == $request['id']) {
                $order['status'] = $request['status'];
                break;
            }
        }
        file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT));
        echo json_encode(['status' => 'success']);
        exit;
    }

    if ($request['action'] === 'delete_order') {
        $orders = json_decode(file_get_contents($ordersFile), true);
        $orders = array_values(array_filter($orders, function ($o) use ($request) {
            return $o['id'] != $request['id'];
        }));
        file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT));
        echo json_encode(['status' => 'success']);
        exit;
    }

    // --- PRODUCT MANAGEMENT ---
    if ($request['action'] === 'get_products') {
        echo file_exists($productsFile) ? file_get_contents($productsFile) : json_encode([]);
        exit;
    }

    if ($request['action'] === 'save_product') {
        $newProduct = $request['product'];
        $products = file_exists($productsFile) ? json_decode(file_get_contents($productsFile), true) : [];

        $found = false;
        if (isset($newProduct['id'])) {
            foreach ($products as &$p) {
                if ($p['id'] == $newProduct['id']) {
                    $p = $newProduct;
                    $found = true;
                    break;
                }
            }
        } else {
            $newProduct['id'] = time(); // New ID
        }

        if (!$found) $products[] = $newProduct;

        file_put_contents($productsFile, json_encode($products, JSON_PRETTY_PRINT));
        echo json_encode(['status' => 'success', 'id' => $newProduct['id']]);
        exit;
    }

    if ($request['action'] === 'delete_product') {
        $products = json_decode(file_get_contents($productsFile), true);
        $products = array_values(array_filter($products, function ($p) use ($request) {
            return $p['id'] != $request['id'];
        }));
        file_put_contents($productsFile, json_encode($products, JSON_PRETTY_PRINT));
        echo json_encode(['status' => 'success']);
        exit;
    }
}

echo json_encode(['status' => 'online', 'service' => 'BTD Tech Engine']);
