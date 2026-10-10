class TargetValidator {
  constructor(db) {
    this.db = db;
  }

  async validateSave(target) {
    const { id, businessYearId, productId, annualTargetQty, areasDistribution } = target;

    if (!businessYearId) {
      throw new Error('Business Year is required.');
    }

    if (!productId) {
      throw new Error('Product is required.');
    }

    const qty = Number(annualTargetQty);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new Error('Annual Target must be a positive integer (greater than 0).');
    }

    // Verify Business Year exists
    const by = await this.db.get('SELECT id FROM business_years WHERE id = ?', [businessYearId]);
    if (!by) {
      throw new Error('Business Year does not exist.');
    }

    // Verify Product exists and is active
    const product = await this.db.get('SELECT id, is_active FROM products WHERE id = ?', [productId]);
    if (!product) {
      throw new Error('Product does not exist.');
    }
    if (product.is_active === 0) {
      throw new Error('Selected Product is inactive and cannot receive targets.');
    }

    // Validate Distribution
    let dist = areasDistribution;
    if (typeof dist === 'string') {
      try {
        dist = JSON.parse(dist);
      } catch (e) {
        throw new Error('Invalid distribution format.');
      }
    }

    if (!Array.isArray(dist) || dist.length === 0) {
      throw new Error('Target distribution cannot be empty.');
    }

    let totalAreaPercentage = 0;
    dist.forEach((areaNode, aIdx) => {
      const areaPct = Number(areaNode.percentage);
      if (isNaN(areaPct) || areaPct < 0 || areaPct > 100) {
        throw new Error(`Invalid percentage for Area '${areaNode.areaName || aIdx}'.`);
      }
      totalAreaPercentage += areaPct;

      const teamMembers = areaNode.teamMembers;
      if (!Array.isArray(teamMembers) || teamMembers.length === 0) {
        throw new Error(`Area '${areaNode.areaName || aIdx}' must contain at least one Team Member assignment.`);
      }

      let totalTmPercentage = 0;
      teamMembers.forEach((tmNode, tIdx) => {
        const tmPct = Number(tmNode.percentage);
        if (isNaN(tmPct) || tmPct < 0 || tmPct > 100) {
          throw new Error(`Invalid percentage for Team Member '${tmNode.name || tIdx}' in Area '${areaNode.areaName}'.`);
        }
        totalTmPercentage += tmPct;
      });

      // Round to 2 decimal places to avoid floating point issues
      if (Math.round(totalTmPercentage * 100) / 100 !== 100) {
        throw new Error(`Target distribution must equal 100%. (Team Member percentages inside Area '${areaNode.areaName}' equal ${totalTmPercentage}% instead of 100%)`);
      }
    });

    if (Math.round(totalAreaPercentage * 100) / 100 !== 100) {
      throw new Error(`Target distribution must equal 100%. (Total Area percentages equal ${totalAreaPercentage}% instead of 100%)`);
    }

    // Check duplicate target: (businessYearId, productId) unique
    const dup = id
      ? await this.db.get(
        'SELECT id FROM product_targets WHERE business_year_id = ? AND product_id = ? AND id != ?',
        [businessYearId, productId, id]
      )
      : await this.db.get(
        'SELECT id FROM product_targets WHERE business_year_id = ? AND product_id = ?',
        [businessYearId, productId]
      );
    if (dup) {
      throw new Error('A target assignment already exists for this Product in the selected Business Year.');
    }
  }

  async validateDelete(id) {
    if (!id) throw new Error('Target ID is required for deletion.');
    // Target can be deleted unless business rules restrict it. In our case, deleting target has no strict dependencies.
  }
}

module.exports = TargetValidator;
