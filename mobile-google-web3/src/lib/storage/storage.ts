import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Simple storage wrapper using AsyncStorage for non-sensitive data
 * Use this for preferences, UI state, etc.
 */
export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Failed to get item ${key}:`, error);
    return null;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to set item ${key}:`, error);
    throw error;
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove item ${key}:`, error);
    throw error;
  }
}

export async function clear(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error("Failed to clear storage:", error);
    throw error;
  }
}

/**
 * Get a string value directly (without JSON parsing)
 */
export async function getString(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to get string ${key}:`, error);
    return null;
  }
}

/**
 * Set a string value directly (without JSON stringifying)
 */
export async function setString(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error(`Failed to set string ${key}:`, error);
    throw error;
  }
}
