import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, Dimensions } from 'react-native';
import {
  Appbar,
  Card,
  Text,
  IconButton,
  FAB,
  Portal,
  Dialog,
  Button,
  TextInput,
  Chip,
  ActivityIndicator,
  List,
  useTheme,
  Surface,
  Searchbar,
  Badge
} from 'react-native-paper';
import { useInventory } from '../../hooks/useInventory';
import { Product } from '../../db/types';
import AppIcon from '../../components/common/AppIcon';

const InventoryScreen = ({ route, navigation }: any) => {
  const { shopId, userRole } = route.params;
  const {
    products,
    isLoading,
    showLowStockOnly,
    addProduct,
    toggleLowStockFilter,
    generateBarcode,
  } = useInventory(shopId);

  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    barcode: '',
    bulkBarcode: '',
    bulkQuantity: '12',
    price: '',
    costPrice: '',
    stockQuantity: '',
    minStockLevel: '',
    unit: 'pcs',
    categoryId: null as string | null,
  });

  const theme = useTheme();

  const handleSave = async () => {
    if (!newProduct.name || !newProduct.price) return;

    await addProduct({
      name: newProduct.name,
      barcode: newProduct.barcode || null,
      bulkBarcode: newProduct.bulkBarcode || null,
      bulkQuantity: parseFloat(newProduct.bulkQuantity) || 1,
      price: parseFloat(newProduct.price) || 0,
      costPrice: parseFloat(newProduct.costPrice) || 0,
      stockQuantity: parseFloat(newProduct.stockQuantity) || 0,
      minStockLevel: parseFloat(newProduct.minStockLevel) || 0,
      unit: newProduct.unit,
      categoryId: newProduct.categoryId,
      description: null,
      supplierId: null,
    });
    setVisible(false);
    setNewProduct({
        name: '',
        barcode: '',
        bulkBarcode: '',
        bulkQuantity: '12',
        price: '',
        costPrice: '',
        stockQuantity: '',
        minStockLevel: '',
        unit: 'pcs',
        categoryId: null,
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchQuery))
  );

  const renderProduct = ({ item }: { item: Product }) => {
    const isLowStock = item.stockQuantity <= item.minStockLevel;
    return (
      <Surface style={styles.productCard} elevation={1}>
        <View style={styles.productInner}>
            <View style={[styles.iconBox, { backgroundColor: isLowStock ? '#FFF5F5' : '#E8F5E9' }]}>
                <AppIcon
                    name={isLowStock ? "package" : "package"}
                    size={28}
                    color={isLowStock ? theme.colors.error : '#43A047'}
                />
            </View>
            <View style={styles.productInfo}>
                <Text variant="titleMedium" style={styles.productName}>{item.name}</Text>
                <Text variant="bodySmall" style={styles.productStock}>
                    {item.stockQuantity} {item.unit} in stock
                </Text>
            </View>
            <View style={styles.productPrice}>
                <Text variant="titleLarge" style={styles.priceValue}>${item.price.toFixed(2)}</Text>
                {isLowStock && <Badge style={styles.lowBadge}>LOW</Badge>}
            </View>
        </View>
      </Surface>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar} elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Stock Inventory" titleStyle={styles.appbarTitle} />
        <IconButton
            icon={showLowStockOnly ? "filter-remove" : "filter"}
            iconColor={showLowStockOnly ? theme.colors.error : theme.colors.primary}
            onPress={toggleLowStockFilter}
        />
      </Appbar.Header>

      <View style={styles.searchSection}>
        <Searchbar
            placeholder="Search by name or code..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            iconColor={theme.colors.primary}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
                <AppIcon name="package" size={80} color="#ccc" />
                <Text variant="bodyLarge" style={{ color: '#999', marginTop: 16 }}>No items found</Text>
            </View>
          }
        />
      )}

      {(userRole === 'OWNER' || userRole === 'MANAGER') && (
        <FAB
          icon="plus"
          label="Add Product"
          style={styles.fab}
          onPress={() => setVisible(true)}
          color="white"
        />
      )}

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)} style={styles.dialog}>
          <Dialog.Title>Add New Product</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 400, paddingHorizontal: 16 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                label="Product Name"
                value={newProduct.name}
                onChangeText={text => setNewProduct({ ...newProduct, name: text })}
                style={styles.input}
                mode="outlined"
              />
              <View style={styles.row}>
                <TextInput
                  label="Barcode"
                  value={newProduct.barcode}
                  onChangeText={text => setNewProduct({ ...newProduct, barcode: text })}
                  style={[styles.input, { flex: 1 }]}
                  mode="outlined"
                />
                <IconButton icon="barcode-scan" onPress={() => setNewProduct({ ...newProduct, barcode: generateBarcode() })} />
              </View>

              <View style={styles.row}>
                <TextInput
                  label="Retail Price"
                  value={newProduct.price}
                  keyboardType="numeric"
                  onChangeText={text => setNewProduct({ ...newProduct, price: text })}
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  mode="outlined"
                />
                <TextInput
                  label="Cost Price"
                  value={newProduct.costPrice}
                  keyboardType="numeric"
                  onChangeText={text => setNewProduct({ ...newProduct, costPrice: text })}
                  style={[styles.input, { flex: 1 }]}
                  mode="outlined"
                />
              </View>

              <View style={styles.row}>
                <TextInput
                  label="Initial Stock"
                  value={newProduct.stockQuantity}
                  keyboardType="numeric"
                  onChangeText={text => setNewProduct({ ...newProduct, stockQuantity: text })}
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  mode="outlined"
                />
                <TextInput
                  label="Min Level"
                  value={newProduct.minStockLevel}
                  keyboardType="numeric"
                  onChangeText={text => setNewProduct({ ...newProduct, minStockLevel: text })}
                  style={[styles.input, { flex: 1 }]}
                  mode="outlined"
                />
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleSave} style={{ borderRadius: 12 }}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  appbar: { backgroundColor: 'white' },
  appbarTitle: { fontWeight: 'bold' },
  searchSection: { padding: 16, backgroundColor: 'white' },
  searchbar: { elevation: 0, backgroundColor: '#F1F3F4', borderRadius: 12 },
  list: { padding: 16 },
  productCard: {
    marginBottom: 12,
    borderRadius: 20,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  productInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
  },
  productName: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  productStock: {
    color: '#666',
  },
  productPrice: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontWeight: '900',
    color: '#333',
  },
  lowBadge: {
    backgroundColor: '#FF5252',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#673AB7',
    borderRadius: 18,
  },
  loader: { flex: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', marginTop: 100 },
  input: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  dialog: { borderRadius: 24 },
});

export default InventoryScreen;
