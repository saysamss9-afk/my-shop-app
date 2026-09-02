describe('requestCameraPermissionSafely', () => {
  it('returns not-required when the native permission API is unavailable', async () => {
    jest.doMock('react-native-vision-camera', () => ({
      Camera: () => null,
      useCameraDevice: () => null,
      useCodeScanner: () => null,
    }));

    const { requestCameraPermissionSafely } = require('./ScannerView');

    await expect(requestCameraPermissionSafely()).resolves.toBe('not-required');
  });
});
