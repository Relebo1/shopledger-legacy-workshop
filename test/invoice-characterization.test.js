'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const pricing = require('../lib/pricing');
const invoice = require('../lib/invoice');

function orderWith(items, coupon) {
  return { id: 7001, items: items, coupon: coupon || '' };
}

test('invoice uses HSN slab when order lines omit gstRate', function () {
  const items = [{ id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 1 }];
  const checkout = pricing.computeTotals(items, '');
  const order = orderWith(items);
  order.total = checkout.total;
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(checkout.tax, 5);
  assert.equal(checkout.total, 105);
  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.tax, checkout.tax);
  assert.equal(figures.total, checkout.total);
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});

test('invoice applies flat coupon before GST and matches order total', function () {
  const items = [{ id: 3, name: 'Tea', hsn: '0902', price: 500, qty: 1 }];
  const checkout = pricing.computeTotals(items, 'FLAT50');
  const order = orderWith(items, 'FLAT50');
  order.total = checkout.total;
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(checkout.discount, 50);
  assert.equal(checkout.tax, 81);
  assert.equal(checkout.total, 531);
  assert.equal(figures.discount, checkout.discount);
  assert.equal(figures.tax, checkout.tax);
  assert.equal(figures.total, checkout.total);
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});

test('invoice applies capped coupon discount before GST and matches order total', function () {
  const items = [{ id: 2, name: 'Tea case', hsn: '0902', price: 5000, qty: 1 }];
  const checkout = pricing.computeTotals(items, 'SAVE10');
  const order = orderWith(items, 'SAVE10');
  order.total = checkout.total;
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 873);
  assert.equal(checkout.total, 5723);
  assert.equal(figures.discount, checkout.discount);
  assert.equal(figures.tax, checkout.tax);
  assert.equal(figures.total, checkout.total);
  assert.doesNotMatch(invoice.render(order), /Accountant Reconciliation Notice/);
});
