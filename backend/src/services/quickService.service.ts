import Service from '../models/Service.model';
import Product from '../models/Product.model';

export const calculateQuickServiceTotals = async (
  items: Array<{
    service?: string;
    product?: string;
    quantity: number;
    type: 'service' | 'product';
  }>
) => {
  let totalSellingPrice = 0;
  let totalCost = 0;

  for (const item of items) {
    if (item.type === 'service' && item.service) {
      const service = await Service.findById(item.service);
      if (!service) {
        throw new Error(`Service ${item.service} not found`);
      }
      totalSellingPrice += service.sellingPrice * item.quantity;
      totalCost += service.costPrice * item.quantity;
    } else if (item.type === 'product' && item.product) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`Product ${item.product} not found`);
      }
      if (product.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }
      totalSellingPrice += product.sellingPrice * item.quantity;
      totalCost += product.costPrice * item.quantity;
    }
  }

  const profit = totalSellingPrice - totalCost;

  return {
    totalSellingPrice,
    totalCost,
    profit,
  };
};
