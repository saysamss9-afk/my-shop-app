import React, { useState } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, StatusBar, Modal } from 'react-native';
import {
  Appbar,
  Card,
  Text,
  Button,
  TextInput,
  List,
  IconButton,
  Divider,
  Portal,
  Dialog,
  ActivityIndicator,
  useTheme,
  Surface,
  TouchableRipple,
  Badge
} from 'react-native-paper';
import { useCheckout } from '../../hooks/useCheckout';
import { useInventory } from '../../hooks/useInventory';
import AppIcon from '../../components/common/AppIcon';
import { ScannerView } from '../../components/ScannerView';

const CheckoutScreen = ({ route, navigation }: any) => {
  const { shopId, employeeId } = route.params;
  const {
    cart,
    total,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    processSale,
    searchProductByBarcode,
  } = useCheckout(shopId, employeeId);

  const { products } = useInventory(shopId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const theme = useTheme();

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode === searchQuery)
  );

  const handleBarcodeSearch = async () => {
    const found = await searchProductByBarcode(searchQuery);
    if (found) setSearchQuery('');
  };

  const handleCameraScan = async (barcode: string) => {
    const found = await searchProductByBarcode(barcode);
    if (!found) {
        // Optionally show a message if product not found
        console.log("Product not found for barcode:", barcode);
    }
  };

  const handleCompleteSale = async () => {
    await processSale('CASH');
    setShowPaymentDialog(false);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Point of Sale" titleStyle={styles.appbarTitle} />
        <IconButton
          icon="barcode-scan"
          iconColor={theme.colors.primary}
          onPress={() => setIsScannerVisible(true)}
        />
      </Appbar.Header>

      <Modal
        visible={isScannerVisible}
        animationType="slide"
        onRequestClose={() => setIsScannerVisible(false)}
      >
        <View style={{ flex: 1 }}>
            <ScannerView
                isActive={isScannerVisible}
                onScan={handleCameraScan}
            />
            <Appbar.Header style={{ position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'transparent' }}>
                <Appbar.BackAction color="white" onPress={() => setIsScannerVisible(false)} />
                <Appbar.Content title="Scan Item" titleStyle={{ color: 'white' }} />
            </Appbar.Header>
            <Surface style={styles.scannerFooter} elevation={4}>
                <Text variant="titleMedium" style={styles.bold}>
                    Items in Cart: {cart.length}
                </Text>
                <Text variant="headlineSmall" style={[styles.bold, { color: theme.colors.primary }]}>
                    Total: ${total.toFixed(2)}
                </Text>
                <Button mode="contained" onPress={() => setIsScannerVisible(false)} style={{ marginTop: 8 }}>
                    Done Scanning
                </Button>
            </Surface>
        </View>
      </Modal>

      <View style={styles.searchSection}>
        <TextInput
          placeholder="Search products to add..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          mode="outlined"
          style={styles.searchInput}
          outlineStyle={styles.searchOutline}
          left={<TextInput.Icon icon="magnify" />}
          right={searchQuery.length > 0 ? <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} /> : null}
        />
        {searchQuery.length > 0 && (
          <Surface style={styles.searchResults} elevation={4}>
            <FlatList
              data={filteredProducts.slice(0, 5)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableRipple
                  onPress={() => {
                      addToCart(item);
                      setSearchQuery('');
                  }}
                  style={styles.resultItem}
                >
                  <View style={styles.resultRow}>
                    <View style={styles.resultInfo}>
                        <Text variant="bodyLarge" style={styles.bold}>{item.name}</Text>
                        <Text variant="bodySmall">Stock: {item.stockQuantity} • ${item.price.toFixed(2)}</Text>
                    </View>
                    <AppIcon name="plus" size={24} color={theme.colors.primary} />
                  </View>
                </TouchableRipple>
              )}
              ItemSeparatorComponent={() => <Divider />}
            />
          </Surface>
        )}
      </View>

      <View style={styles.cartHeader}>
          <Text variant="titleLarge" style={styles.cartTitle}>Order Summary</Text>
          <Badge style={styles.cartBadge} size={24}>{cart.length}</Badge>
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item) => item.product.id}
        renderItem={({ item }) => (
          <Surface style={styles.cartItem} elevation={1}>
              <View style={styles.cartItemInner}>
                  <View style={styles.itemInfo}>
                      <Text variant="titleMedium" style={styles.itemName}>{item.product.name}</Text>
                      <Text variant="bodySmall" style={styles.itemPrice}>${item.product.price.toFixed(2)} / unit</Text>
                  </View>
                  <View style={styles.qtyContainer}>
                      <View style={styles.qtyControls}>
                          <IconButton icon="minus" size={16} onPress={() => updateQuantity(item.product.id, item.quantity - 1)} style={styles.qtyBtn} />
                          <Text style={styles.qtyText}>{item.quantity}</Text>
                          <IconButton icon="plus" size={16} onPress={() => updateQuantity(item.product.id, item.quantity + 1)} style={styles.qtyBtn} />
                      </View>
                      <Text variant="titleMedium" style={styles.itemSubtotal}>${(item.product.price * item.quantity).toFixed(2)}</Text>
                  </View>
                  <IconButton icon="delete-outline" iconColor={theme.colors.error} size={20} onPress={() => removeFromCart(item.product.id)} />
              </View>
          </Surface>
        )}
        contentContainerStyle={styles.cartList}
        ListEmptyComponent={
          <View style={styles.empty}>
              <AppIcon name="cart" size={80} color="#eee" />
              <Text variant="bodyLarge" style={{ color: '#bbb', marginTop: 16 }}>Your cart is empty</Text>
          </View>
        }
      />

      <Surface style={styles.footer} elevation={5}>
        <View style={styles.totalSection}>
            <View style={styles.totalRow}>
                <Text variant="bodyLarge" style={{ color: '#666' }}>Subtotal</Text>
                <Text variant="bodyLarge">${total.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, { marginTop: 8 }]}>
                <Text variant="headlineSmall" style={styles.bold}>Total Amount</Text>
                <Text variant="headlineSmall" style={[styles.bold, { color: theme.colors.primary }]}>${total.toFixed(2)}</Text>
            </View>
        </View>
        <Button
          mode="contained"
          onPress={() => setShowPaymentDialog(true)}
          disabled={cart.length === 0 || isLoading}
          loading={isLoading}
          style={styles.payBtn}
          contentStyle={styles.payBtnContent}
          icon="cash-register"
        >
          Collect Payment
        </Button>
      </Surface>

      <Portal>
        <Dialog visible={showPaymentDialog} onDismiss={() => setShowPaymentDialog(false)} style={styles.dialog}>
          <Dialog.Title>Finalize Sale</Dialog.Title>
          <Dialog.Content>
              <View style={styles.dialogSummary}>
                <Text variant="labelLarge" style={{ color: '#666' }}>Amount Due</Text>
                <Text variant="displaySmall" style={{ fontWeight: '900', color: theme.colors.primary }}>${total.toFixed(2)}</Text>
              </View>
              <Divider style={{ marginVertical: 20 }} />
              <View style={styles.paymentMethod}>
                <AppIcon name="wallet" size={24} color="#666" />
                <Text variant="bodyLarge" style={{ marginLeft: 12 }}>Method: <Text style={styles.bold}>CASH</Text></Text>
              </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPaymentDialog(false)}>Back</Button>
            <Button mode="contained" onPress={handleCompleteSale} style={{ borderRadius: 12 }}>Confirm Transaction</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  appbar: { backgroundColor: 'white', elevation: 0 },
  appbarTitle: { fontWeight: 'bold' },
  searchSection: { padding: 16, backgroundColor: 'white', zIndex: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchInput: { backgroundColor: '#F1F3F4', height: 50 },
  searchOutline: { borderRadius: 12, borderWidth: 0 },
  searchResults: { position: 'absolute', top: 75, left: 16, right: 16, borderRadius: 16, backgroundColor: 'white', overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  resultItem: { padding: 12 },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultInfo: { flex: 1 },
  cartHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 10 },
  cartTitle: { fontWeight: 'bold', marginRight: 12 },
  cartBadge: { backgroundColor: '#673AB7' },
  cartList: { padding: 16, paddingBottom: 120 },
  cartItem: { marginBottom: 10, borderRadius: 20, backgroundColor: 'white' },
  cartItemInner: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontWeight: 'bold' },
  itemPrice: { color: '#666' },
  qtyContainer: { alignItems: 'flex-end', marginHorizontal: 8 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F3F4', borderRadius: 10 },
  qtyBtn: { margin: 0 },
  qtyText: { fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  itemSubtotal: { fontWeight: 'bold', color: '#333', marginTop: 4 },
  footer: { padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: 'white', position: 'absolute', bottom: 0, left: 0, right: 0 },
  totalSection: { marginBottom: 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payBtn: { borderRadius: 16 },
  payBtnContent: { paddingVertical: 10, flexDirection: 'row-reverse' },
  bold: { fontWeight: 'bold' },
  empty: { alignItems: 'center', marginTop: 100 },
  dialog: { borderRadius: 28 },
  dialogSummary: { alignItems: 'center' },
  paymentMethod: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  scannerFooter: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
  }
});

export default CheckoutScreen;
