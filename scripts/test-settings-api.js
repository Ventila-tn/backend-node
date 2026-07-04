#!/usr/bin/env node
/**
 * Script de test pour vérifier l'API des settings
 * Usage: node scripts/test-settings-api.js
 */

const BASE_URL = 'https://backend-node-dun.vercel.app/api';

async function testSettingsAPI() {
    console.log('🧪 Test de l\'API Settings');
    console.log('='.repeat(50));

    try {
        // Test 1: Récupérer les frais de livraison
        console.log('📥 Test 1: GET /settings/delivery-fee');
        const getResponse = await fetch(`${BASE_URL}/settings/delivery-fee`);
        
        if (!getResponse.ok) {
            throw new Error(`HTTP ${getResponse.status}: ${getResponse.statusText}`);
        }
        
        const deliveryFee = await getResponse.json();
        console.log(`✅ Frais de livraison actuels: ${deliveryFee} TND`);
        
        if (deliveryFee === 0 || deliveryFee === null) {
            console.log('⚠️  PROBLÈME: Les frais de livraison sont à 0 !');
            console.log('💡 Solution: Exécuter le script SQL de fix');
            return;
        }

        // Test 2: Mettre à jour les frais (test avec la même valeur)
        console.log(`\n📤 Test 2: PUT /settings/delivery-fee (valeur: ${deliveryFee})`);
        const putResponse = await fetch(`${BASE_URL}/settings/delivery-fee`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value: deliveryFee })
        });

        if (!putResponse.ok) {
            throw new Error(`HTTP ${putResponse.status}: ${putResponse.statusText}`);
        }

        const updatedFee = await putResponse.json();
        console.log(`✅ Frais mis à jour: ${updatedFee} TND`);

        // Test 3: Vérifier que la mise à jour a fonctionné
        console.log('\n🔄 Test 3: Vérification après mise à jour');
        const verifyResponse = await fetch(`${BASE_URL}/settings/delivery-fee`);
        const verifiedFee = await verifyResponse.json();
        console.log(`✅ Frais vérifiés: ${verifiedFee} TND`);

        console.log('\n🎉 SUCCÈS: L\'API Settings fonctionne correctement !');
        console.log(`💰 Frais de livraison configurés: ${verifiedFee} TND`);

    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
        console.log('\n🔧 Actions à effectuer:');
        console.log('1. Vérifier que la base de données est accessible');
        console.log('2. Exécuter le script backend-node/scripts/deploy-settings-fix.sql');
        console.log('3. Redémarrer l\'application si nécessaire');
        process.exit(1);
    }
}

// Test simple de l'endpoint
async function quickTest() {
    try {
        const response = await fetch(`${BASE_URL}/settings/delivery-fee`);
        const fee = await response.json();
        
        if (fee > 0) {
            console.log('✅ RAPIDE: Frais de livraison OK -', fee, 'TND');
        } else {
            console.log('❌ RAPIDE: Frais de livraison KO -', fee, 'TND');
        }
    } catch (error) {
        console.log('❌ RAPIDE: API inaccessible -', error.message);
    }
}

// Exécuter selon l'argument
const arg = process.argv[2];

if (arg === '--quick' || arg === '-q') {
    quickTest();
} else {
    testSettingsAPI();
}