<?php

class Ps_SlatwallInitModuleFrontController extends ModuleFrontController
{
    public function initContent()
    {
        parent::initContent();

        // Przekazujemy zmienne do szablonu Smarty
        $moduleUri = $this->module->getPathUri();
        $this->context->smarty->assign([
            'catalog_url' => $moduleUri . 'assets/catalog.json',
            'module_uri' => $moduleUri,
            'base_url' => $this->context->shop->getBaseURL()
        ]);

        $this->setTemplate('module:ps_slatwall/views/templates/front/app.tpl');
    }
}

