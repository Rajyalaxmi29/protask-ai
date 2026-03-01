import { useState, useEffect } from 'react';

export interface CustomLabel {
    id: string;
    name: string;
    createdAt: number;
}

export interface LabelItem {
    id: string;
    labelId: string;
    title: string;
    completed: boolean;
    createdAt: number;
}

export function useCustomLabels() {
    const [labels, setLabels] = useState<CustomLabel[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('protask_custom_labels');
        if (saved) {
            try {
                setLabels(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse labels from localStorage', e);
            }
        }
    }, []);

    const saveLabels = (newLabels: CustomLabel[]) => {
        localStorage.setItem('protask_custom_labels', JSON.stringify(newLabels));
        setLabels(newLabels);
    };

    const addLabel = (name: string) => {
        const newLabel: CustomLabel = {
            id: crypto.randomUUID(),
            name,
            createdAt: Date.now()
        };
        saveLabels([...labels, newLabel]);
        return newLabel;
    };

    const removeLabel = (id: string) => {
        saveLabels(labels.filter(lb => lb.id !== id));
        // Also remove associated items
        const savedItems = localStorage.getItem('protask_label_items');
        if (savedItems) {
            try {
                const items: LabelItem[] = JSON.parse(savedItems);
                const newItems = items.filter(item => item.labelId !== id);
                localStorage.setItem('protask_label_items', JSON.stringify(newItems));
            } catch (e) { }
        }
    };

    return { labels, addLabel, removeLabel };
}

export function useLabelItems(labelId: string | undefined) {
    const [items, setItems] = useState<LabelItem[]>([]);

    useEffect(() => {
        if (!labelId) {
            setItems([]);
            return;
        }
        const saved = localStorage.getItem('protask_label_items');
        if (saved) {
            try {
                const allItems: LabelItem[] = JSON.parse(saved);
                setItems(allItems.filter(item => item.labelId === labelId));
            } catch (e) {
                console.error('Failed to parse label items from localStorage', e);
            }
        }
    }, [labelId]);

    const saveItems = (newItems: LabelItem[]) => {
        // We only have the visible items for this label in state, 
        // so we must read all items first, filter out the cur ones, and append.
        const saved = localStorage.getItem('protask_label_items');
        let allItems: LabelItem[] = [];
        if (saved) {
            try {
                allItems = JSON.parse(saved);
            } catch (e) { }
        }

        // Remove all old items for this labelId
        const otherItems = allItems.filter(item => item.labelId !== labelId);

        // Add the new ones
        const updatedAllItems = [...otherItems, ...newItems];
        localStorage.setItem('protask_label_items', JSON.stringify(updatedAllItems));
        setItems(newItems);
    };

    const addItem = (title: string) => {
        if (!labelId) return;
        const newItem: LabelItem = {
            id: crypto.randomUUID(),
            labelId,
            title,
            completed: false,
            createdAt: Date.now()
        };
        saveItems([...items, newItem]);
    };

    const toggleItem = (id: string) => {
        saveItems(items.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
    };

    const removeItem = (id: string) => {
        saveItems(items.filter(item => item.id !== id));
    };

    return { items, addItem, toggleItem, removeItem };
}
