import { supabase } from './supabase.js';
import {
  nav,
  requireAuth,
  profile,
  logout,
  esc,
  img,
  toast,
  slugify
} from './utils.js';

document.querySelector('#nav').innerHTML = nav('dashboard');

const u = await requireAuth();

if (u) {
  const p = await profile();

  // ---------------------------------------------------------
  // CHECK ACCOUNT TYPE
  // ---------------------------------------------------------
  if (p?.account_type !== 'business' && p?.account_type !== 'admin') {
    location.href = 'dashboard.html';
  }

  // ---------------------------------------------------------
  // DOM ELEMENTS
  // ---------------------------------------------------------
  const bizForm = document.querySelector('#bizForm');
  const category = document.querySelector('#category');
  const notice = document.querySelector('#notice');

  const bname = document.querySelector('#bname');
  const desc = document.querySelector('#desc');
  const bphone = document.querySelector('#bphone');
  const wa = document.querySelector('#wa');
  const bemail = document.querySelector('#bemail');
  const website = document.querySelector('#website');
  const address = document.querySelector('#address');
  const area = document.querySelector('#area');
  const cover = document.querySelector('#cover');

  const bizStatus = document.querySelector('#bizStatus');
  const plan = document.querySelector('#plan');

  const products = document.querySelector('#products');
  const deals = document.querySelector('#deals');

  const productsCount = document.querySelector('#productsCount');
  const dealsCount = document.querySelector('#dealsCount');

  const productForm = document.querySelector('#productForm');
  const pname = document.querySelector('#pname');
  const pdesc = document.querySelector('#pdesc');
  const price = document.querySelector('#price');
  const pimage = document.querySelector('#pimage');

  const dealForm = document.querySelector('#dealForm');
  const dtitle = document.querySelector('#dtitle');
  const ddesc = document.querySelector('#ddesc');
  const original = document.querySelector('#original');
  const dealprice = document.querySelector('#dealprice');
  const end = document.querySelector('#end');
  const dimage = document.querySelector('#dimage');

  const logoutButton = document.querySelector('#logout');

  let business = null;

  // ---------------------------------------------------------
  // LOAD CATEGORIES
  // ---------------------------------------------------------
  async function loadCategories() {
    if (!category) return;

    category.disabled = true;
    category.innerHTML = '<option value="">Loading categories...</option>';

    const { data: cats, error } = await supabase
      .from('categories')
      .select('id,name,slug,icon,active')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Categories loading error:', error);

      category.innerHTML =
        '<option value="">Unable to load categories</option>';

      category.disabled = true;

      toast(
        'Unable to load business categories. Please refresh the page.',
        false
      );

      return;
    }

    if (!cats || cats.length === 0) {
      category.innerHTML =
        '<option value="">No categories available</option>';

      category.disabled = true;

      toast(
        'No business categories are available yet.',
        false
      );

      return;
    }

    category.innerHTML =
      '<option value="">Select a category</option>' +
      cats
        .map(
          c =>
            `<option value="${esc(c.id)}">${esc(c.icon ? `${c.icon} ` : '')}${esc(c.name)}</option>`
        )
        .join('');

    category.disabled = false;
  }

  // ---------------------------------------------------------
  // LOAD BUSINESS
  // ---------------------------------------------------------
  async function load() {
    const { data, error } = await supabase
      .from('businesses')
      .select('*,categories(name)')
      .eq('owner_id', u.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Business loading error:', error);

      business = null;

      notice.innerHTML =
        '<div class="notice">Unable to load your business information. Please refresh and try again.</div>';

      return;
    }

    business = data;

    if (business) {
      bname.value = business.business_name || '';

      category.value = business.category_id || '';

      desc.value = business.description || '';
      bphone.value = business.phone || '';
      wa.value = business.whatsapp || '';
      bemail.value = business.email || '';
      website.value = business.website || '';
      address.value = business.address || '';
      area.value = business.area || '';
      cover.value = business.cover_image_url || '';

      bizStatus.textContent = business.status || '—';
      plan.textContent = business.plan || 'Free';

      if (business.status === 'pending') {
        notice.innerHTML =
          '<div class="notice">Your business is waiting for admin approval. You can still prepare products and deals.</div>';
      } else if (business.status === 'rejected') {
        notice.innerHTML =
          '<div class="notice">Your business was rejected. Please update it and contact admin.</div>';
      } else if (business.status === 'approved') {
        notice.innerHTML =
          '<div class="notice">Your business has been approved and is visible to customers.</div>';
      } else {
        notice.innerHTML = '';
      }
    } else {
      notice.innerHTML =
        '<div class="notice">Create your first business listing below.</div>';

      bizStatus.textContent = '—';
      plan.textContent = 'Free';
    }

    await loadItems();
  }

  // ---------------------------------------------------------
  // LOAD PRODUCTS + DEALS
  // ---------------------------------------------------------
  async function loadItems() {
    const pid = business?.id;

    if (!pid) {
      productsCount.textContent = '0';
      dealsCount.textContent = '0';

      products.innerHTML =
        '<div class="empty">Save your business first to add products.</div>';

      deals.innerHTML =
        '<div class="empty">Save your business first to create deals.</div>';

      return;
    }

    // ---------------- PRODUCTS ----------------
    const {
      data: productData,
      error: productError
    } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', pid)
      .order('created_at', { ascending: false });

    if (productError) {
      console.error('Products loading error:', productError);

      productsCount.textContent = '0';

      products.innerHTML =
        '<div class="empty">Unable to load products.</div>';
    } else {
      productsCount.textContent = productData?.length || 0;

      products.innerHTML =
        (productData || [])
          .map(
            x => `
              <div class="card">
                <div class="card-img">
                  ${img(x.image_url, x.name)}
                </div>

                <div class="card-body">
                  <h3>${esc(x.name)}</h3>

                  <p>${esc(x.description || '')}</p>

                  <b>
                    ${
                      x.price != null
                        ? '$' + Number(x.price).toFixed(2)
                        : 'Contact'
                    }
                  </b>

                  <div class="actions">
                    <button
                      class="btn small danger"
                      data-del-product="${esc(x.id)}"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            `
          )
          .join('') || '<div class="empty">No products yet.</div>';
    }

    // ---------------- DEALS ----------------
    const {
      data: dealData,
      error: dealError
    } = await supabase
      .from('deals')
      .select('*')
      .eq('business_id', pid)
      .order('created_at', { ascending: false });

    if (dealError) {
      console.error('Deals loading error:', dealError);

      dealsCount.textContent = '0';

      deals.innerHTML =
        '<div class="empty">Unable to load deals.</div>';
    } else {
      dealsCount.textContent = dealData?.length || 0;

      deals.innerHTML =
        (dealData || [])
          .map(
            x => `
              <div class="card">
                <div class="card-img">
                  ${img(x.image_url, x.title)}
                </div>

                <div class="card-body">
                  <h3>${esc(x.title)}</h3>

                  <p>${esc(x.description || '')}</p>

                  <b>
                    ${
                      x.deal_price != null
                        ? '$' + Number(x.deal_price).toFixed(2)
                        : ''
                    }
                  </b>

                  <div class="actions">
                    <button
                      class="btn small danger"
                      data-del-deal="${esc(x.id)}"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            `
          )
          .join('') || '<div class="empty">No deals yet.</div>';
    }

    // ---------------- DELETE PRODUCT ----------------
    document
      .querySelectorAll('[data-del-product]')
      .forEach(button => {
        button.onclick = async () => {
          const id = button.dataset.delProduct;

          if (!id) return;

          const confirmed = confirm(
            'Are you sure you want to delete this product?'
          );

          if (!confirmed) return;

          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .eq('business_id', pid);

          if (error) {
            console.error('Delete product error:', error);
            toast(error.message || 'Unable to delete product.', false);
            return;
          }

          toast('Product deleted successfully.', true);

          await loadItems();
        };
      });

    // ---------------- DELETE DEAL ----------------
    document
      .querySelectorAll('[data-del-deal]')
      .forEach(button => {
        button.onclick = async () => {
          const id = button.dataset.delDeal;

          if (!id) return;

          const confirmed = confirm(
            'Are you sure you want to delete this deal?'
          );

          if (!confirmed) return;

          const { error } = await supabase
            .from('deals')
            .delete()
            .eq('id', id)
            .eq('business_id', pid);

          if (error) {
            console.error('Delete deal error:', error);
            toast(error.message || 'Unable to delete deal.', false);
            return;
          }

          toast('Deal deleted successfully.', true);

          await loadItems();
        };
      });
  }

  // ---------------------------------------------------------
  // SAVE BUSINESS
  // ---------------------------------------------------------
  bizForm.onsubmit = async e => {
    e.preventDefault();

    if (!category.value) {
      toast('Please select a business category.', false);
      category.focus();
      return;
    }

    const row = {
      owner_id: u.id,
      business_name: bname.value.trim(),
      slug: `${slugify(bname.value)}-${u.id.slice(0, 6)}`,
      category_id: category.value,
      description: desc.value.trim(),
      phone: bphone.value.trim(),
      whatsapp: wa.value.trim(),
      email: bemail.value.trim(),
      website: website.value.trim(),
      address: address.value.trim(),
      area: area.value.trim(),
      cover_image_url: cover.value.trim(),
      city: 'Nassau',
      country: 'Bahamas'
    };

    if (!row.business_name) {
      toast('Please enter your business name.', false);
      bname.focus();
      return;
    }

    let r;

    if (business) {
      r = await supabase
        .from('businesses')
        .update(row)
        .eq('id', business.id)
        .eq('owner_id', u.id);
    } else {
      r = await supabase
        .from('businesses')
        .insert(row);
    }

    if (r.error) {
      console.error('Save business error:', r.error);

      toast(
        r.error.message || 'Unable to save business.',
        false
      );

      return;
    }

    toast('Business saved successfully.', true);

    await load();
  };

  // ---------------------------------------------------------
  // ADD PRODUCT
  // ---------------------------------------------------------
  productForm.onsubmit = async e => {
    e.preventDefault();

    if (!business) {
      toast(
        'Create and save your business first.',
        false
      );
      return;
    }

    const row = {
      business_id: business.id,
      name: pname.value.trim(),
      description: pdesc.value.trim(),
      price: price.value
        ? Number(price.value)
        : null,
      image_url: pimage.value.trim(),
      currency: 'USD'
    };

    if (!row.name) {
      toast('Please enter a product name.', false);
      pname.focus();
      return;
    }

    const { error } = await supabase
      .from('products')
      .insert(row);

    if (error) {
      console.error('Add product error:', error);

      toast(
        error.message || 'Unable to add product.',
        false
      );

      return;
    }

    toast('Product added successfully.', true);

    productForm.reset();

    await loadItems();
  };

  // ---------------------------------------------------------
  // ADD DEAL
  // ---------------------------------------------------------
  dealForm.onsubmit = async e => {
    e.preventDefault();

    if (!business) {
      toast(
        'Create and save your business first.',
        false
      );
      return;
    }

    const row = {
      business_id: business.id,
      title: dtitle.value.trim(),
      description: ddesc.value.trim(),
      original_price: original.value
        ? Number(original.value)
        : null,
      deal_price: dealprice.value
        ? Number(dealprice.value)
        : null,
      image_url: dimage.value.trim(),
      end_date: end.value
        ? new Date(end.value).toISOString()
        : null,
      status: 'active'
    };

    if (!row.title) {
      toast('Please enter a deal title.', false);
      dtitle.focus();
      return;
    }

    const { error } = await supabase
      .from('deals')
      .insert(row);

    if (error) {
      console.error('Create deal error:', error);

      toast(
        error.message || 'Unable to create deal.',
        false
      );

      return;
    }

    toast('Deal created successfully.', true);

    dealForm.reset();

    await loadItems();
  };

  // ---------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------
  logoutButton.onclick = logout;

  // ---------------------------------------------------------
  // INITIALIZE PAGE
  // ---------------------------------------------------------
  await loadCategories();
  await load();
}
