<?php
if (!defined('_PS_VERSION_')) {
    exit;
}

class Ps_Slatwall extends Module
{
    public function __construct()
    {
        $this->name = 'ps_slatwall';
        $this->tab = 'front_office_features';
        $this->version = '1.0.0';
        $this->author = 'Twój Nick';
        $this->need_instance = 0;
        $this->ps_versions_compliancy = [
            'min' => '8.0.0',
            'max' => _PS_VERSION_
        ];
        $this->bootstrap = true;

        parent::__construct();

        $this->displayName = $this->l('Slatwall Smart Configurator');
        $this->description = $this->l('Konfigurator ścianek Slatwall oparty na React.');
    }

    public function install()
    {
        return parent::install() &&
            $this->registerHook('moduleRoutes') &&
            $this->registerHook('displayHeader');
    }

    public function uninstall()
    {
        return parent::uninstall();
    }

    // Dodajemy ładny URL: twojsklep.pl/konfigurator
    public function hookModuleRoutes($params)
    {
        return [
            'module-ps_slatwall-init' => [
                'controller' => 'init',
                'rule' => 'konfigurator',
                'keywords' => [],
                'params' => [
                    'fc' => 'module',
                    'module' => 'ps_slatwall',
                ],
            ],
        ];
    }

    public function hookDisplayHeader()
    {
        // Sprawdzamy czy jesteśmy na stronie modułu na kilka sposobów
        $isModulePage = false;
        
        if (isset($this->context->controller)) {
            // Sprawdź php_self
            if (isset($this->context->controller->php_self) && 
                $this->context->controller->php_self == 'module-ps_slatwall-init') {
                $isModulePage = true;
            }
            
            // Sprawdź czy kontroler to nasz moduł
            if (get_class($this->context->controller) == 'Ps_SlatwallInitModuleFrontController') {
                $isModulePage = true;
            }
            
            // Sprawdź w URL
            if (isset($_GET['module']) && $_GET['module'] == $this->name) {
                $isModulePage = true;
            }
        }
        
        // Ładujemy CSS i JS tylko na stronie konfiguratora
        if ($isModulePage) {
            $this->context->controller->registerStylesheet(
                'modules-slatwall-style',
                'modules/' . $this->name . '/assets/css/style.css',
                ['media' => 'all', 'priority' => 150]
            );
            
            // Ładujemy skompilowany React (build.js)
            $this->context->controller->registerJavascript(
                'modules-slatwall-app',
                'modules/' . $this->name . '/assets/js/build.js',
                ['position' => 'bottom', 'priority' => 150]
            );
        }
    }
}

